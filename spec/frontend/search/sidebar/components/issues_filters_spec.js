import { shallowMount } from '@vue/test-utils';
import Vue from 'vue';
// eslint-disable-next-line no-restricted-imports
import Vuex from 'vuex';
import { MOCK_QUERY } from 'jest/search/mock_data';
import IssuesFilters from '~/search/sidebar/components/issues_filters.vue';
import ConfidentialityFilter from '~/search/sidebar/components/confidentiality_filter/index.vue';
import StatusFilter from '~/search/sidebar/components/status_filter/index.vue';
import LabelFilter from '~/search/sidebar/components/label_filter/index.vue';
import ArchivedFilter from '~/search/sidebar/components/archived_filter/index.vue';
import { SEARCH_TYPE_ADVANCED, SEARCH_TYPE_BASIC } from '~/search/sidebar/constants';

Vue.use(Vuex);

describe('GlobalSearch IssuesFilters', () => {
  let wrapper;

  const defaultGetters = {
    currentScope: () => 'issues',
  };

  const createComponent = ({ initialState = {}, searchIssueLabelAggregation = true } = {}) => {
    const store = new Vuex.Store({
      state: {
        urlQuery: MOCK_QUERY,
        searchType: SEARCH_TYPE_ADVANCED,
        ...initialState,
      },
      getters: defaultGetters,
    });

    wrapper = shallowMount(IssuesFilters, {
      store,
      provide: {
        glFeatures: {
          searchIssueLabelAggregation,
        },
      },
    });
  };

  const findStatusFilter = () => wrapper.findComponent(StatusFilter);
  const findConfidentialityFilter = () => wrapper.findComponent(ConfidentialityFilter);
  const findLabelFilter = () => wrapper.findComponent(LabelFilter);
  const findArchivedFilter = () => wrapper.findComponent(ArchivedFilter);

  describe.each`
    description                                       | searchIssueLabelAggregation
    ${'Renders correctly with Label Filter disabled'} | ${false}
    ${'Renders correctly with Label Filter enabled'}  | ${true}
  `('$description', ({ searchIssueLabelAggregation }) => {
    beforeEach(() => {
      createComponent({
        searchIssueLabelAggregation,
      });
    });

    it('renders StatusFilter', () => {
      expect(findStatusFilter().exists()).toBe(true);
    });

    it('renders ConfidentialityFilter', () => {
      expect(findConfidentialityFilter().exists()).toBe(true);
    });

    it('renders correctly ArchivedFilter', () => {
      expect(findArchivedFilter().exists()).toBe(true);
    });

    it(`renders correctly LabelFilter when searchIssueLabelAggregation is ${searchIssueLabelAggregation}`, () => {
      expect(findLabelFilter().exists()).toBe(searchIssueLabelAggregation);
    });
  });

  describe('Renders correctly with basic search', () => {
    beforeEach(() => {
      createComponent({ initialState: { searchType: SEARCH_TYPE_BASIC } });
    });
    it('renders StatusFilter', () => {
      expect(findStatusFilter().exists()).toBe(true);
    });

    it('renders ConfidentialityFilter', () => {
      expect(findConfidentialityFilter().exists()).toBe(true);
    });

    it("doesn't render LabelFilter", () => {
      expect(findLabelFilter().exists()).toBe(false);
    });

    it("doesn't render ArchivedFilter", () => {
      expect(findArchivedFilter().exists()).toBe(true);
    });
  });

  describe('Renders correctly with wrong scope', () => {
    beforeEach(() => {
      defaultGetters.currentScope = () => 'test';
      createComponent();
    });
    it("doesn't render StatusFilter", () => {
      expect(findStatusFilter().exists()).toBe(false);
    });

    it("doesn't render ConfidentialityFilter", () => {
      expect(findConfidentialityFilter().exists()).toBe(false);
    });

    it("doesn't render LabelFilter", () => {
      expect(findLabelFilter().exists()).toBe(false);
    });

    it("doesn't render ArchivedFilter", () => {
      expect(findArchivedFilter().exists()).toBe(false);
    });
  });
});
