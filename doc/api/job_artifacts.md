---
stage: Verify
group: Pipeline Security
info: To determine the technical writer assigned to the Stage/Group associated with this page, see https://about.gitlab.com/handbook/product/ux/technical-writing/#assignments
---

# Job Artifacts API **(FREE ALL)**

Use the job artifacts API to download or delete job artifacts.

Authentication with a [CI/CD job token](../ci/jobs/ci_job_token.md#download-an-artifact-from-a-different-pipeline)
available in the Premium and Ultimate tier.

## Get job artifacts

> The use of `CI_JOB_TOKEN` in the artifacts download API was [introduced](https://gitlab.com/gitlab-org/gitlab/-/merge_requests/2346) in [GitLab Premium](https://about.gitlab.com/pricing/) 9.5.

Get the job's artifacts zipped archive of a project.

If you use cURL to download artifacts from GitLab.com, use the `--location` parameter
as the request might redirect through a CDN.

```plaintext
GET /projects/:id/jobs/:job_id/artifacts
```

| Attribute                 | Type           | Required | Description |
|---------------------------|----------------|----------|-------------|
| `id`                      | integer/string | Yes      | ID or [URL-encoded path of the project](rest/index.md#namespaced-path-encoding). |
| `job_id`                  | integer        | Yes      | ID of a job. |
| `job_token` **(PREMIUM ALL)** | string     | No       | To be used with [triggers](../ci/jobs/ci_job_token.md#download-an-artifact-from-a-different-pipeline) for multi-project pipelines. It should be invoked only in a CI/CD job defined in the `.gitlab-ci.yml` file. The value is always `$CI_JOB_TOKEN`. The job associated with the `$CI_JOB_TOKEN` must be running when this token is used. |

Example request using the `PRIVATE-TOKEN` header:

```shell
curl --location --output artifacts.zip --location --header "PRIVATE-TOKEN: <your_access_token>" "https://gitlab.example.com/api/v4/projects/1/jobs/42/artifacts"
```

In the Premium and Ultimate tier you can authenticate with this endpoint
in a CI/CD job by using a [CI/CD job token](../ci/jobs/ci_job_token.md).

Use either:

- The `job_token` attribute with the GitLab-provided `CI_JOB_TOKEN` predefined variable.
  For example, the following job downloads the artifacts of the job with ID `42`:

  ```yaml
  artifact_download:
    stage: test
    script:
      - 'curl --location --output artifacts.zip "https://gitlab.example.com/api/v4/projects/1/jobs/42/artifacts?job_token=$CI_JOB_TOKEN"'
  ```

- The `JOB-TOKEN` header with the GitLab-provided `CI_JOB_TOKEN` predefined variable.
  For example, the following job downloads the artifacts of the job with ID
  `42`. The command is wrapped in single quotes because it contains a
  colon (`:`):

  ```yaml
  artifact_download:
    stage: test
    script:
      - 'curl --location --output artifacts.zip --header "JOB-TOKEN: $CI_JOB_TOKEN" "https://gitlab.example.com/api/v4/projects/1/jobs/42/artifacts"'
  ```

Possible response status codes:

| Status    | Description                     |
|-----------|---------------------------------|
| 200       | Serves the artifacts file.      |
| 404       | Build not found or no artifacts.|

## Download the artifacts archive

> The use of `CI_JOB_TOKEN` in the artifacts download API was [introduced](https://gitlab.com/gitlab-org/gitlab/-/merge_requests/2346) in [GitLab Premium](https://about.gitlab.com/pricing/) 9.5.

Download the artifacts zipped archive from the latest **successful** pipeline for
the given reference name and job, provided the job finished successfully. This
is the same as [getting the job's artifacts](#get-job-artifacts), but by
defining the job's name instead of its ID.

If you use cURL to download artifacts from GitLab.com, use the `--location` parameter
as the request might redirect through a CDN.

NOTE:
If a pipeline is [parent of other child pipelines](../ci/pipelines/downstream_pipelines.md#parent-child-pipelines), artifacts
are searched in hierarchical order from parent to child. For example, if both parent and
child pipelines have a job with the same name, the artifact from the parent pipeline is returned.

```plaintext
GET /projects/:id/jobs/artifacts/:ref_name/download?job=name
```

Parameters

| Attribute                 | Type           | Required | Description |
|---------------------------|----------------|----------|-------------|
| `id`                      | integer/string | Yes      | ID or [URL-encoded path of the project](rest/index.md#namespaced-path-encoding). |
| `ref_name`                | string         | Yes      | Branch or tag name in repository. HEAD or SHA references are not supported. |
| `job`                     | string         | Yes      | The name of the job. |
| `job_token` **(PREMIUM ALL)** | string     | No       | To be used with [triggers](../ci/jobs/ci_job_token.md#download-an-artifact-from-a-different-pipeline) for multi-project pipelines. It should be invoked only in a CI/CD job defined in the `.gitlab-ci.yml` file. The value is always `$CI_JOB_TOKEN`. The job associated with the `$CI_JOB_TOKEN` must be running when this token is used. |

Example request using the `PRIVATE-TOKEN` header:

```shell
curl --location --header "PRIVATE-TOKEN: <your_access_token>" "https://gitlab.example.com/api/v4/projects/1/jobs/artifacts/main/download?job=test"
```

In the Premium and Ultimate tier you can authenticate with this endpoint
in a CI/CD job by using a [CI/CD job token](../ci/jobs/ci_job_token.md).

Use either:

- The `job_token` attribute with the GitLab-provided `CI_JOB_TOKEN` predefined variable.
  For example, the following job downloads the artifacts of the `test` job
  of the `main` branch:

  ```yaml
  artifact_download:
    stage: test
    script:
      - 'curl --location --output artifacts.zip "https://gitlab.example.com/api/v4/projects/$CI_PROJECT_ID/jobs/artifacts/main/download?job=test&job_token=$CI_JOB_TOKEN"'
  ```

- The `JOB-TOKEN` header with the GitLab-provided `CI_JOB_TOKEN` predefined variable.
  For example, the following job downloads the artifacts of the `test` job
  of the `main` branch. The command is wrapped in single quotes
  because it contains a colon (`:`):

  ```yaml
  artifact_download:
    stage: test
    script:
      - 'curl --location --output artifacts.zip --header "JOB-TOKEN: $CI_JOB_TOKEN" "https://gitlab.example.com/api/v4/projects/$CI_PROJECT_ID/jobs/artifacts/main/download?job=test"'
  ```

Possible response status codes:

| Status    | Description                     |
|-----------|---------------------------------|
| 200       | Serves the artifacts file.      |
| 404       | Build not found or no artifacts.|

## Download a single artifact file by job ID

Download a single artifact file from a job with a specified ID from inside
the job's artifacts zipped archive. The file is extracted from the archive and
streamed to the client.

If you use cURL to download artifacts from GitLab.com, use the `--location` parameter
as the request might redirect through a CDN.

```plaintext
GET /projects/:id/jobs/:job_id/artifacts/*artifact_path
```

Parameters

| Attribute                 | Type           | Required | Description |
|---------------------------|----------------|----------|-------------|
| `id`                      | integer/string | Yes      | ID or [URL-encoded path of the project](rest/index.md#namespaced-path-encoding). |
| `job_id`                  | integer        | Yes      | The unique job identifier. |
| `artifact_path`           | string         | Yes      | Path to a file inside the artifacts archive. |
| `job_token` **(PREMIUM ALL)** | string     | No       | To be used with [triggers](../ci/jobs/ci_job_token.md#download-an-artifact-from-a-different-pipeline) for multi-project pipelines. It should be invoked only in a CI/CD job defined in the `.gitlab-ci.yml` file. The value is always `$CI_JOB_TOKEN`. The job associated with the `$CI_JOB_TOKEN` must be running when this token is used. |

Example request:

```shell
curl --location --header "PRIVATE-TOKEN: <your_access_token>" "https://gitlab.example.com/api/v4/projects/1/jobs/5/artifacts/some/release/file.pdf"
```

In the Premium and Ultimate tier you can authenticate with this endpoint
in a CI/CD job by using a [CI/CD job token](../ci/jobs/ci_job_token.md).

Possible response status codes:

| Status    | Description                          |
|-----------|--------------------------------------|
| 200       | Sends a single artifact file         |
| 400       | Invalid path provided                |
| 404       | Build not found or no file/artifacts |

## Download a single artifact file from specific tag or branch

Download a single artifact file for a specific job of the latest **successful** pipeline
for the given reference name from inside the job's artifacts archive.
The file is extracted from the archive and streamed to the client.

The artifact file provides more detail than what is available in the
[CSV export](../user/application_security/vulnerability_report/index.md#export-vulnerability-details).

Artifacts for [parent and child pipelines](../ci/pipelines/downstream_pipelines.md#parent-child-pipelines)
are searched in hierarchical order from parent to child. For example, if both parent and child pipelines
have a job with the same name, the artifact from the parent pipeline is returned.

If you use cURL to download artifacts from GitLab.com, use the `--location` parameter
as the request might redirect through a CDN.

```plaintext
GET /projects/:id/jobs/artifacts/:ref_name/raw/*artifact_path?job=name
```

Parameters:

| Attribute                 | Type           | Required | Description |
|---------------------------|----------------|----------|-------------|
| `id`                      | integer/string | Yes      | ID or [URL-encoded path of the project](rest/index.md#namespaced-path-encoding). |
| `ref_name`                | string         | Yes      | Branch or tag name in repository. `HEAD` or `SHA` references are not supported. |
| `artifact_path`           | string         | Yes      | Path to a file inside the artifacts archive. |
| `job`                     | string         | Yes      | The name of the job. |
| `job_token` **(PREMIUM ALL)** | string     | No       | To be used with [triggers](../ci/jobs/ci_job_token.md#download-an-artifact-from-a-different-pipeline) for multi-project pipelines. It should be invoked only in a CI/CD job defined in the `.gitlab-ci.yml` file. The value is always `$CI_JOB_TOKEN`. The job associated with the `$CI_JOB_TOKEN` must be running when this token is used. |

Example request:

```shell
curl --location --header "PRIVATE-TOKEN: <your_access_token>" "https://gitlab.example.com/api/v4/projects/1/jobs/artifacts/main/raw/some/release/file.pdf?job=pdf"
```

In the Premium and Ultimate tier you can authenticate with this endpoint
in a CI/CD job by using a [CI/CD job token](../ci/jobs/ci_job_token.md).

Possible response status codes:

| Status    | Description                          |
|-----------|--------------------------------------|
| 200       | Sends a single artifact file         |
| 400       | Invalid path provided                |
| 404       | Build not found or no file/artifacts |

## Keep artifacts

Prevents artifacts from being deleted when expiration is set.

```plaintext
POST /projects/:id/jobs/:job_id/artifacts/keep
```

Parameters

| Attribute | Type           | Required | Description |
|-----------|----------------|----------|-------------|
| `id`      | integer/string | Yes      | ID or [URL-encoded path of the project](rest/index.md#namespaced-path-encoding) owned by the authenticated user. |
| `job_id`  | integer        | Yes      | ID of a job. |

Example request:

```shell
curl --request POST --header "PRIVATE-TOKEN: <your_access_token>" "https://gitlab.example.com/api/v4/projects/1/jobs/1/artifacts/keep"
```

Example response:

```json
{
  "commit": {
    "author_email": "admin@example.com",
    "author_name": "Administrator",
    "created_at": "2015-12-24T16:51:14.000+01:00",
    "id": "0ff3ae198f8601a285adcf5c0fff204ee6fba5fd",
    "message": "Test the CI integration.",
    "short_id": "0ff3ae19",
    "title": "Test the CI integration."
  },
  "coverage": null,
  "allow_failure": false,
  "download_url": null,
  "id": 42,
  "name": "rubocop",
  "ref": "main",
  "artifacts": [],
  "runner": null,
  "stage": "test",
  "created_at": "2016-01-11T10:13:33.506Z",
  "started_at": "2016-01-11T10:13:33.506Z",
  "finished_at": "2016-01-11T10:15:10.506Z",
  "duration": 97.0,
  "status": "failed",
  "failure_reason": "script_failure",
  "tag": false,
  "web_url": "https://example.com/foo/bar/-/jobs/42",
  "user": null
}
```

## Delete job artifacts

Delete artifacts of a job.

Prerequisites:

- Must have at least the maintainer role in the project.

```plaintext
DELETE /projects/:id/jobs/:job_id/artifacts
```

| Attribute | Type           | Required | Description |
|-----------|----------------|----------|-------------|
| `id`      | integer/string | Yes      | ID or [URL-encoded path of the project](rest/index.md#namespaced-path-encoding). |
| `job_id`  | integer        | Yes      | ID of a job. |

Example request:

```shell
curl --request DELETE --header "PRIVATE-TOKEN: <your_access_token>" "https://gitlab.example.com/api/v4/projects/1/jobs/1/artifacts"
```

NOTE:
At least Maintainer role is required to delete artifacts.

If the artifacts were deleted successfully, a response with status `204 No Content` is returned.

## Delete project artifacts

> - [Introduced](https://gitlab.com/gitlab-org/gitlab/-/issues/223793) in GitLab 14.7 [with a flag](../administration/feature_flags.md) named `bulk_expire_project_artifacts`. Enabled by default on GitLab self-managed. Enabled on GitLab.com.
> - [Feature flag removed](https://gitlab.com/gitlab-org/gitlab/-/issues/350609) in GitLab 14.10.

Delete artifacts eligible for deletion in a project. By default, artifacts from
[the most recent successful pipeline of each ref](../ci/jobs/job_artifacts.md#keep-artifacts-from-most-recent-successful-jobs).
are not deleted.

Requests to this endpoint set the expiry of all artifacts that
can be deleted to the current time. The files are then deleted from the system as part
of the regular cleanup of expired job artifacts. Job logs are never deleted.

The regular cleanup occurs asynchronously on a schedule, so there might be a short delay
before artifacts are deleted.

Prerequisites:

- You must have at least the Maintainer role for the project.

```plaintext
DELETE /projects/:id/artifacts
```

| Attribute | Type           | Required | Description |
|-----------|----------------|----------|-------------|
| `id`      | integer/string | Yes      | ID or [URL-encoded path of the project](rest/index.md#namespaced-path-encoding). |

Example request:

```shell
curl --request DELETE --header "PRIVATE-TOKEN: <your_access_token>" "https://gitlab.example.com/api/v4/projects/1/artifacts"
```

A response with status `202 Accepted` is returned.
