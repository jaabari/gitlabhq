import {
  organizations,
  organizationProjects,
  organizationGroups,
  updateOrganizationResponse,
} from '../../mock_data';

const simulateLoading = () => {
  return new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });
};

export default {
  Query: {
    organization: async () => {
      // Simulate API loading
      await simulateLoading();

      return {
        ...organizations[0],
        projects: organizationProjects,
        groups: organizationGroups,
      };
    },
  },
  UserCore: {
    organizations: async () => {
      await simulateLoading();

      return {
        nodes: organizations,
      };
    },
  },
  Mutation: {
    updateOrganization: async () => {
      // Simulate API loading
      await simulateLoading();

      return updateOrganizationResponse;
    },
  },
};
