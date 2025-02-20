# frozen_string_literal: true
module MergeRequests
  module Mergeability
    class CheckDiscussionsStatusService < CheckBaseService
      def self.failure_reason
        :discussions_not_resolved
      end

      def execute
        return inactive unless merge_request.only_allow_merge_if_all_discussions_are_resolved?

        if merge_request.mergeable_discussions_state?
          success
        else
          failure
        end
      end

      def skip?
        params[:skip_discussions_check].present?
      end

      def cacheable?
        false
      end
    end
  end
end
