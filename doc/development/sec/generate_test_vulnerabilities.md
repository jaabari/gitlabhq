---
type: reference, howto
stage: Govern
group: Threat Insights
info: Any user with at least the Maintainer role can merge updates to this content. For details, see https://docs.gitlab.com/ee/development/development_processes.html#development-guidelines-review.
---

# Generate test vulnerabilities

You can generate test vulnerabilities for the [Vulnerability Report](../../user/application_security/vulnerability_report/index.md) to test GitLab
vulnerability management features without running a pipeline.

1. Log in to GitLab.
1. Go to `/-/profile/personal_access_tokens` and generate a personal access token with `api` permissions.
1. Go to your project page and find the project ID. You can find the project ID below the project title.
1. [Clone the GitLab repository](../../gitlab-basics/start-using-git.md#clone-a-repository) to your local machine.
1. Open a terminal and go to `gitlab/qa` directory.
1. Run `bundle install`
1. Run the following command:

```shell
GITLAB_QA_ACCESS_TOKEN=<your_personal_access_token> GITLAB_URL="<address:port>" bundle exec rake vulnerabilities:setup\[<your_project_id>,<vulnerability_count>\] --trace
```

Make sure you do the following:

- Replace `<your_personal_access_token>` with the token you generated in step one.
- Double check the `GITLAB_URL`. It should point to address and port of your GitLab instance, for example `http://localhost:3000` if you are running GDK
- Replace `<your_project_id>` with the ID you obtained in step three above.
- Replace `<vulnerability_count>` with the number of vulnerabilities you'd like to generate.

The script creates the specified number of placeholder vulnerabilities in the project.
