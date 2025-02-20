# frozen_string_literal: true

module QA
  RSpec.describe 'Govern' do
    describe 'Group access token', product_group: :authentication do
      include QA::Support::Helpers::Project

      let(:group_access_token) { create(:group_access_token) }
      let(:api_client) { Runtime::API::Client.new(:gitlab, personal_access_token: group_access_token.token) }
      let(:project) do
        create(:project, name: 'project-for-group-access-token', group: group_access_token.group)
      end

      before do
        wait_until_project_is_ready(project)
      end

      it(
        'can be used to create a file via the project API',
        testcase: 'https://gitlab.com/gitlab-org/gitlab/-/quality/test_cases/367064'
      ) do
        expect do
          create(:file,
            api_client: api_client,
            project: project,
            branch: "new_branch_#{SecureRandom.hex(8)}")
        rescue StandardError => e
          QA::Runtime::Logger.error("Full failure message: #{e.message}")
          raise
        end.not_to raise_error
      end

      it(
        'can be used to commit via the API',
        testcase: 'https://gitlab.com/gitlab-org/gitlab/-/quality/test_cases/367067'
      ) do
        expect do
          create(:commit,
            api_client: api_client,
            project: project,
            branch: "new_branch_#{SecureRandom.hex(8)}",
            start_branch: project.default_branch,
            commit_message: 'Add new file', actions: [
              { action: 'create', file_path: "text-#{SecureRandom.hex(8)}.txt", content: 'new file' }
            ])
        rescue StandardError => e
          QA::Runtime::Logger.error("Full failure message: #{e.message}")
          raise
        end.not_to raise_error
      end
    end
  end
end
