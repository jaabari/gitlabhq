# frozen_string_literal: true

module BulkImports
  class EntityWorker
    include ApplicationWorker
    include ExclusiveLeaseGuard

    idempotent!
    deduplicate :until_executing
    data_consistency :always
    feature_category :importers
    sidekiq_options retry: 3, dead: false
    worker_has_external_dependencies!

    sidekiq_retries_exhausted do |msg, exception|
      new.perform_failure(exception, msg['args'].first)
    end

    PERFORM_DELAY = 5.seconds

    # Keep `_current_stage` parameter for backwards compatibility.
    # The parameter will be remove in https://gitlab.com/gitlab-org/gitlab/-/issues/426311
    def perform(entity_id, _current_stage = nil)
      @entity = ::BulkImports::Entity.find(entity_id)

      return unless @entity.started?

      if running_tracker.present?
        log_info(message: 'Stage running', entity_stage: running_tracker.stage)
      else
        # Use lease guard to prevent duplicated workers from starting multiple stages
        try_obtain_lease do
          start_next_stage
        end
      end

      re_enqueue
    end

    def perform_failure(exception, entity_id)
      @entity = ::BulkImports::Entity.find(entity_id)

      Gitlab::ErrorTracking.track_exception(
        exception,
        log_params(message: "Request to export #{entity.source_type} failed")
      )

      entity.fail_op!
    end

    private

    attr_reader :entity

    def re_enqueue
      with_context(bulk_import_entity_id: entity.id) do
        BulkImports::EntityWorker.perform_in(PERFORM_DELAY, entity.id)
      end
    end

    def running_tracker
      @running_tracker ||= BulkImports::Tracker.running_trackers(entity.id).first
    end

    def next_pipeline_trackers_for(entity_id)
      BulkImports::Tracker.next_pipeline_trackers_for(entity_id).update(status_event: 'enqueue')
    end

    def start_next_stage
      next_pipeline_trackers = next_pipeline_trackers_for(entity.id)

      next_pipeline_trackers.each_with_index do |pipeline_tracker, index|
        log_info(message: 'Stage starting', entity_stage: pipeline_tracker.stage) if index == 0

        with_context(bulk_import_entity_id: entity.id) do
          BulkImports::PipelineWorker.perform_async(
            pipeline_tracker.id,
            pipeline_tracker.stage,
            entity.id
          )
        end
      end
    end

    def lease_timeout
      PERFORM_DELAY
    end

    def lease_key
      "gitlab:bulk_imports:entity_worker:#{entity.id}"
    end

    def log_lease_taken
      log_info(message: lease_taken_message)
    end

    def source_version
      entity.bulk_import.source_version_info.to_s
    end

    def logger
      @logger ||= Logger.build
    end

    def log_exception(exception, payload)
      Gitlab::ExceptionLogFormatter.format!(exception, payload)

      logger.error(structured_payload(payload))
    end

    def log_info(payload)
      logger.info(structured_payload(log_params(payload)))
    end

    def log_params(extra)
      defaults = {
        bulk_import_entity_id: entity.id,
        bulk_import_id: entity.bulk_import_id,
        bulk_import_entity_type: entity.source_type,
        source_full_path: entity.source_full_path,
        source_version: source_version,
        importer: Logger::IMPORTER_NAME
      }

      defaults.merge(extra)
    end
  end
end
