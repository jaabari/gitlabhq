# frozen_string_literal: true

module BulkImports
  class FinishBatchedPipelineWorker
    include ApplicationWorker
    include ExceptionBacktrace

    REQUEUE_DELAY = 5.seconds
    STALE_AFTER = 4.hours

    idempotent!
    deduplicate :until_executing
    data_consistency :always # rubocop:disable SidekiqLoadBalancing/WorkerDataConsistency
    feature_category :importers

    version 2

    def perform(pipeline_tracker_id)
      @tracker = Tracker.find(pipeline_tracker_id)
      @context = ::BulkImports::Pipeline::Context.new(tracker)

      return unless tracker.batched? && tracker.started?

      @sorted_batches = tracker.batches.by_last_updated
      return fail_stale_tracker_and_batches if most_recent_batch_stale?

      return re_enqueue if import_in_progress?

      tracker.pipeline_class.new(@context).on_finish
      logger.info(log_attributes(message: 'Tracker finished'))
      tracker.finish!
    end

    private

    attr_reader :tracker, :sorted_batches

    def re_enqueue
      with_context(bulk_import_entity_id: tracker.entity.id) do
        self.class.perform_in(REQUEUE_DELAY, tracker.id)
      end
    end

    def import_in_progress?
      sorted_batches.any? { |b| b.started? || b.created? }
    end

    def most_recent_batch_stale?
      return false unless sorted_batches.any?

      sorted_batches.first.updated_at < STALE_AFTER.ago
    end

    def fail_stale_tracker_and_batches
      logger.error(log_attributes(message: 'Batch stale. Failing batches and tracker'))
      sorted_batches.map(&:fail_op!)
      tracker.fail_op!
    end

    def logger
      @logger ||= Logger.build
    end

    def log_attributes(extra = {})
      structured_payload(
        {
          tracker_id: tracker.id,
          bulk_import_id: tracker.entity.id,
          bulk_import_entity_id: tracker.entity.bulk_import_id,
          pipeline_class: tracker.pipeline_name
        }.merge(extra)
      )
    end
  end
end
