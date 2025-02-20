<script>
import { GlLoadingIcon, GlIntersectionObserver } from '@gitlab/ui';
import { WORKSPACE_PROJECT } from '~/issues/constants';
import ConfidentialityBadge from '~/vue_shared/components/confidentiality_badge.vue';
import WorkItemActions from './work_item_actions.vue';
import WorkItemTodos from './work_item_todos.vue';

export default {
  components: {
    GlIntersectionObserver,
    GlLoadingIcon,
    WorkItemActions,
    WorkItemTodos,
    ConfidentialityBadge,
  },
  props: {
    workItem: {
      type: Object,
      required: true,
    },
    fullPath: {
      type: String,
      required: true,
    },
    isStickyHeaderShowing: {
      type: Boolean,
      required: true,
    },
    workItemNotificationsSubscribed: {
      type: Boolean,
      required: true,
    },
    workItemParentId: {
      type: String,
      required: false,
      default: null,
    },
    updateInProgress: {
      type: Boolean,
      required: false,
      default: false,
    },
    parentWorkItemConfidentiality: {
      type: Boolean,
      required: false,
      default: false,
    },
    showWorkItemCurrentUserTodos: {
      type: Boolean,
      required: false,
      default: false,
    },
    isModal: {
      type: Boolean,
      required: false,
      default: false,
    },
    currentUserTodos: {
      type: Array,
      required: false,
      default: () => [],
    },
  },
  computed: {
    canUpdate() {
      return this.workItem.userPermissions?.updateWorkItem;
    },
    canDelete() {
      return this.workItem.userPermissions?.deleteWorkItem;
    },
    workItemType() {
      return this.workItem.workItemType?.name;
    },
    workItemTypeId() {
      return this.workItem.workItemType?.id;
    },
    projectFullPath() {
      return this.workItem.namespace?.fullPath;
    },
  },
  WORKSPACE_PROJECT,
};
</script>

<template>
  <gl-intersection-observer
    @appear="$emit('hideStickyHeader')"
    @disappear="$emit('showStickyHeader')"
  >
    <transition name="issuable-header-slide">
      <div
        v-if="isStickyHeaderShowing"
        class="issue-sticky-header gl-fixed gl-bg-white gl-border-b gl-z-index-3 gl-py-2"
        data-testid="work-item-sticky-header"
      >
        <div
          class="gl-align-items-center gl-mx-auto gl-px-5 gl-display-flex gl-max-w-container-xl gl-gap-3"
        >
          <span class="gl-text-truncate gl-font-weight-bold gl-pr-3 gl-mr-auto">
            {{ workItem.title }}
          </span>
          <gl-loading-icon v-if="updateInProgress" />
          <confidentiality-badge
            v-if="workItem.confidential"
            :issuable-type="workItemType"
            :workspace-type="$options.WORKSPACE_PROJECT"
          />
          <work-item-todos
            v-if="showWorkItemCurrentUserTodos"
            :work-item-id="workItem.id"
            :work-item-iid="workItem.iid"
            :work-item-fullpath="projectFullPath"
            :current-user-todos="currentUserTodos"
            @error="$emit('error')"
          />
          <work-item-actions
            :full-path="fullPath"
            :work-item-id="workItem.id"
            :subscribed-to-notifications="workItemNotificationsSubscribed"
            :work-item-type="workItemType"
            :work-item-type-id="workItemTypeId"
            :can-delete="canDelete"
            :can-update="canUpdate"
            :is-confidential="workItem.confidential"
            :is-parent-confidential="parentWorkItemConfidentiality"
            :work-item-reference="workItem.reference"
            :work-item-create-note-email="workItem.createNoteEmail"
            :work-item-state="workItem.state"
            :work-item-parent-id="workItemParentId"
            :is-modal="isModal"
            @deleteWorkItem="$emit('deleteWorkItem')"
            @toggleWorkItemConfidentiality="
              $emit('toggleWorkItemConfidentiality', !workItem.confidential)
            "
            @error="$emit('error')"
            @promotedToObjective="$emit('promotedToObjective')"
          />
        </div>
      </div>
    </transition>
  </gl-intersection-observer>
</template>
