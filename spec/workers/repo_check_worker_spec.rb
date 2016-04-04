require 'spec_helper'

describe RepoCheckWorker do
  subject { RepoCheckWorker.new }

  it 'prefers projects that have never been checked' do
    projects = 3.times.map { create(:project) }
    projects[0].update_column(:last_repo_check_at, 1.month.ago)
    projects[2].update_column(:last_repo_check_at, 3.weeks.ago)

    expect(subject.perform).to eq(projects.values_at(1, 0, 2).map(&:id))
  end

  it 'sorts projects by last_repo_check_at' do
    projects = 3.times.map { create(:project) }
    projects[0].update_column(:last_repo_check_at, 2.weeks.ago)
    projects[1].update_column(:last_repo_check_at, 1.month.ago)
    projects[2].update_column(:last_repo_check_at, 3.weeks.ago)

    expect(subject.perform).to eq(projects.values_at(1, 2, 0).map(&:id))
  end

  it 'excludes projects that were checked recently' do
    projects = 3.times.map { create(:project) }
    projects[0].update_column(:last_repo_check_at, 2.days.ago)
    projects[1].update_column(:last_repo_check_at, 1.month.ago)
    projects[2].update_column(:last_repo_check_at, 3.days.ago)

    expect(subject.perform).to eq([projects[1].id])
  end
end
