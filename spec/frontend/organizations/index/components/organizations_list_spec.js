import { GlKeysetPagination } from '@gitlab/ui';
import { shallowMount } from '@vue/test-utils';
import OrganizationsList from '~/organizations/index/components/organizations_list.vue';
import OrganizationsListItem from '~/organizations/index/components/organizations_list_item.vue';
import { organizations as nodes, pageInfo, pageInfoOnePage } from '~/organizations/mock_data';

describe('OrganizationsList', () => {
  let wrapper;

  const createComponent = ({ propsData = {} } = {}) => {
    wrapper = shallowMount(OrganizationsList, {
      propsData: {
        organizations: {
          nodes,
          pageInfo,
        },
        ...propsData,
      },
    });
  };

  const findAllOrganizationsListItem = () => wrapper.findAllComponents(OrganizationsListItem);
  const findPagination = () => wrapper.findComponent(GlKeysetPagination);

  describe('template', () => {
    it('renders a list item for each organization', () => {
      createComponent();

      expect(findAllOrganizationsListItem()).toHaveLength(nodes.length);
    });

    describe('when there is one page of organizations', () => {
      beforeEach(() => {
        createComponent({
          propsData: {
            organizations: {
              nodes,
              pageInfo: pageInfoOnePage,
            },
          },
        });
      });

      it('does not render pagination', () => {
        expect(findPagination().exists()).toBe(false);
      });
    });

    describe('when there are multiple pages of organizations', () => {
      beforeEach(() => {
        createComponent();
      });

      it('renders pagination', () => {
        expect(findPagination().props()).toMatchObject(pageInfo);
      });

      describe('when `GlKeysetPagination` emits `next` event', () => {
        const endCursor = 'mockEndCursor';

        beforeEach(() => {
          findPagination().vm.$emit('next', endCursor);
        });

        it('emits `next` event', () => {
          expect(wrapper.emitted('next')).toEqual([[endCursor]]);
        });
      });

      describe('when `GlKeysetPagination` emits `prev` event', () => {
        const startCursor = 'startEndCursor';

        beforeEach(() => {
          findPagination().vm.$emit('prev', startCursor);
        });

        it('emits `prev` event', () => {
          expect(wrapper.emitted('prev')).toEqual([[startCursor]]);
        });
      });
    });
  });
});
