# frozen_string_literal: true

class QueueBackfillMergeRequestDiffsProjectId < Gitlab::Database::Migration[2.2]
  milestone '16.7'
  restrict_gitlab_migration gitlab_schema: :gitlab_main

  MIGRATION = "BackfillMergeRequestDiffsProjectId"
  DELAY_INTERVAL = 2.minutes
  BATCH_SIZE = 10000
  SUB_BATCH_SIZE = 100

  def up
    queue_batched_background_migration(
      MIGRATION,
      :merge_request_diffs,
      :id,
      job_interval: DELAY_INTERVAL,
      queued_migration_version: '20231114043522',
      batch_size: BATCH_SIZE,
      sub_batch_size: SUB_BATCH_SIZE
    )
  end

  def down
    delete_batched_background_migration(MIGRATION, :merge_request_diffs, :id, [])
  end
end
