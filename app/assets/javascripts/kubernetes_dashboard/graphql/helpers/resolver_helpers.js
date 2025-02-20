import { CoreV1Api, Configuration, WatchApi, EVENT_DATA } from '@gitlab/cluster-client';

export const handleClusterError = async (err) => {
  if (!err.response) {
    throw err;
  }

  const errorData = await err.response.json();
  throw errorData;
};

export const buildWatchPath = ({ resource, api = 'api/v1', namespace = '' }) => {
  return namespace ? `/${api}/namespaces/${namespace}/${resource}` : `/${api}/${resource}`;
};

export const watchPods = ({ client, query, configuration, namespace }) => {
  const path = buildWatchPath({ resource: 'pods', namespace });
  const config = new Configuration(configuration);
  const watcherApi = new WatchApi(config);

  watcherApi
    .subscribeToStream(path, { watch: true })
    .then((watcher) => {
      let result = [];

      watcher.on(EVENT_DATA, (data) => {
        result = data.map((item) => {
          return { status: { phase: item.status.phase } };
        });

        client.writeQuery({
          query,
          variables: { configuration, namespace },
          data: { k8sPods: result },
        });
      });
    })
    .catch((err) => {
      handleClusterError(err);
    });
};

export const getK8sPods = ({
  client,
  query,
  configuration,
  namespace = '',
  enableWatch = false,
}) => {
  const config = new Configuration(configuration);

  const coreV1Api = new CoreV1Api(config);
  const podsApi = namespace
    ? coreV1Api.listCoreV1NamespacedPod({ namespace })
    : coreV1Api.listCoreV1PodForAllNamespaces();

  return podsApi
    .then((res) => {
      if (enableWatch) {
        watchPods({ client, query, configuration, namespace });
      }

      return res?.items || [];
    })
    .catch(async (err) => {
      try {
        await handleClusterError(err);
      } catch (error) {
        throw new Error(error.message);
      }
    });
};
