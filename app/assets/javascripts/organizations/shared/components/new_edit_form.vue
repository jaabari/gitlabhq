<script>
import {
  GlForm,
  GlFormFields,
  GlButton,
  GlFormInputGroup,
  GlFormInput,
  GlInputGroupText,
  GlTruncate,
} from '@gitlab/ui';
import { formValidators } from '@gitlab/ui/dist/utils';
import { s__, __ } from '~/locale';
import { slugify } from '~/lib/utils/text_utility';
import { joinPaths } from '~/lib/utils/url_utility';
import { FORM_FIELD_NAME, FORM_FIELD_ID, FORM_FIELD_PATH } from '../constants';

export default {
  name: 'NewEditForm',
  components: {
    GlForm,
    GlFormFields,
    GlButton,
    GlFormInputGroup,
    GlFormInput,
    GlInputGroupText,
    GlTruncate,
  },
  i18n: {
    cancel: __('Cancel'),
    pathPlaceholder: s__('Organization|my-organization'),
  },
  formId: 'new-organization-form',
  inject: ['organizationsPath', 'rootUrl'],
  props: {
    loading: {
      type: Boolean,
      required: true,
    },
    initialFormValues: {
      type: Object,
      required: false,
      default() {
        return {
          [FORM_FIELD_NAME]: '',
          [FORM_FIELD_PATH]: '',
        };
      },
    },
    fieldsToRender: {
      type: Array,
      required: false,
      default() {
        return [FORM_FIELD_NAME, FORM_FIELD_PATH];
      },
    },
    submitButtonText: {
      type: String,
      required: false,
      default: s__('Organization|Create organization'),
    },
    showCancelButton: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  data() {
    return {
      formValues: this.initialFormValues,
      hasPathBeenManuallySet: false,
    };
  },
  computed: {
    baseUrl() {
      return joinPaths(this.rootUrl, this.organizationsPath, '/');
    },
    fields() {
      const fields = {
        [FORM_FIELD_NAME]: {
          label: s__('Organization|Organization name'),
          validators: [formValidators.required(s__('Organization|Organization name is required.'))],
          groupAttrs: {
            class: this.fieldsToRender.includes(FORM_FIELD_ID)
              ? 'gl-flex-grow-1 gl-md-form-input-lg'
              : 'gl-flex-grow-1',
            description: s__(
              'Organization|Must start with a letter, digit, emoji, or underscore. Can also contain periods, dashes, spaces, and parentheses.',
            ),
          },
          inputAttrs: {
            class: !this.fieldsToRender.includes(FORM_FIELD_ID) ? 'gl-md-form-input-lg' : null,
            placeholder: s__('Organization|My organization'),
          },
        },
        [FORM_FIELD_ID]: {
          label: s__('Organization|Organization ID'),
          groupAttrs: {
            class: 'gl-md-form-input-lg gl-flex-grow-1',
          },
          inputAttrs: {
            disabled: true,
          },
        },
        [FORM_FIELD_PATH]: {
          label: s__('Organization|Organization URL'),
          validators: [
            formValidators.required(s__('Organization|Organization URL is required.')),
            formValidators.factory(
              s__('Organization|Organization URL must be a minimum of two characters.'),
              (val) => val.length >= 2,
            ),
          ],
          groupAttrs: {
            class: 'gl-w-full',
          },
        },
      };

      return Object.entries(fields).reduce((accumulator, [fieldKey, fieldDefinition]) => {
        if (!this.fieldsToRender.includes(fieldKey)) {
          return accumulator;
        }

        return {
          ...accumulator,
          [fieldKey]: fieldDefinition,
        };
      }, {});
    },
  },
  watch: {
    'formValues.name': function watchName(value) {
      if (this.hasPathBeenManuallySet || !this.fieldsToRender.includes(FORM_FIELD_PATH)) {
        return;
      }

      this.formValues.path = slugify(value);
    },
  },
  methods: {
    onPathInput(event, formFieldsInputEvent) {
      formFieldsInputEvent(event);
      this.hasPathBeenManuallySet = true;
    },
  },
};
</script>

<template>
  <gl-form :id="$options.formId">
    <gl-form-fields
      v-model="formValues"
      :form-id="$options.formId"
      :fields="fields"
      class="gl-display-flex gl-column-gap-5 gl-flex-wrap"
      @submit="$emit('submit', formValues)"
    >
      <template #input(path)="{ id, value, validation, input, blur }">
        <gl-form-input-group>
          <template #prepend>
            <gl-input-group-text class="organization-root-path">
              <gl-truncate :text="baseUrl" position="middle" />
            </gl-input-group-text>
          </template>
          <gl-form-input
            v-bind="validation"
            :id="id"
            :value="value"
            :placeholder="$options.i18n.pathPlaceholder"
            class="gl-h-auto! gl-md-form-input-lg"
            @input="onPathInput($event, input)"
            @blur="blur"
          />
        </gl-form-input-group>
      </template>
    </gl-form-fields>
    <div class="gl-display-flex gl-gap-3">
      <gl-button type="submit" variant="confirm" class="js-no-auto-disable" :loading="loading">{{
        submitButtonText
      }}</gl-button>
      <gl-button v-if="showCancelButton" :href="organizationsPath">{{
        $options.i18n.cancel
      }}</gl-button>
    </div>
  </gl-form>
</template>
