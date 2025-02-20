import { nextTick } from 'vue';
import { GlDrawer, GlFormCombobox, GlFormInput, GlFormSelect, GlModal } from '@gitlab/ui';
import { mountExtended, shallowMountExtended } from 'helpers/vue_test_utils_helper';
import CiEnvironmentsDropdown from '~/ci/ci_variable_list/components/ci_environments_dropdown.vue';
import CiVariableDrawer from '~/ci/ci_variable_list/components/ci_variable_drawer.vue';
import { awsTokenList } from '~/ci/ci_variable_list/components/ci_variable_autocomplete_tokens';
import {
  ADD_VARIABLE_ACTION,
  DRAWER_EVENT_LABEL,
  EDIT_VARIABLE_ACTION,
  EVENT_ACTION,
  variableOptions,
  projectString,
  variableTypes,
} from '~/ci/ci_variable_list/constants';
import { mockTracking } from 'helpers/tracking_helper';
import { mockVariablesWithScopes } from '../mocks';

describe('CI Variable Drawer', () => {
  let wrapper;
  let trackingSpy;

  const itif = (condition) => (condition ? it : it.skip);

  const mockProjectVariable = mockVariablesWithScopes(projectString)[0];
  const mockProjectVariableFileType = mockVariablesWithScopes(projectString)[1];
  const mockEnvScope = 'staging';
  const mockEnvironments = ['*', 'dev', 'staging', 'production'];

  // matches strings that contain at least 8 consecutive characters consisting of only
  // letters (both uppercase and lowercase), digits, or the specified special characters
  const maskableRegex = '^[a-zA-Z0-9_+=/@:.~-]{8,}$';

  // matches strings that consist of at least 8 or more non-whitespace characters
  const maskableRawRegex = '^\\S{8,}$';

  const defaultProps = {
    areEnvironmentsLoading: false,
    areScopedVariablesAvailable: true,
    environments: mockEnvironments,
    hideEnvironmentScope: false,
    selectedVariable: {},
    mode: ADD_VARIABLE_ACTION,
  };

  const defaultProvide = {
    isProtectedByDefault: true,
    environmentScopeLink: '/help/environments',
    maskableRawRegex,
    maskableRegex,
  };

  const createComponent = ({
    mountFn = shallowMountExtended,
    props = {},
    provide = {},
    stubs = {},
  } = {}) => {
    wrapper = mountFn(CiVariableDrawer, {
      propsData: {
        ...defaultProps,
        ...props,
      },
      provide: {
        ...defaultProvide,
        ...provide,
      },
      stubs,
    });
  };

  const findConfirmBtn = () => wrapper.findByTestId('ci-variable-confirm-button');
  const findConfirmDeleteModal = () => wrapper.findComponent(GlModal);
  const findDeleteBtn = () => wrapper.findByTestId('ci-variable-delete-button');
  const findDisabledEnvironmentScopeDropdown = () => wrapper.findComponent(GlFormInput);
  const findDrawer = () => wrapper.findComponent(GlDrawer);
  const findEnvironmentScopeDropdown = () => wrapper.findComponent(CiEnvironmentsDropdown);
  const findExpandedCheckbox = () => wrapper.findByTestId('ci-variable-expanded-checkbox');
  const findKeyField = () => wrapper.findComponent(GlFormCombobox);
  const findMaskedCheckbox = () => wrapper.findByTestId('ci-variable-masked-checkbox');
  const findProtectedCheckbox = () => wrapper.findByTestId('ci-variable-protected-checkbox');
  const findValueField = () => wrapper.findByTestId('ci-variable-value');
  const findValueLabel = () => wrapper.findByTestId('ci-variable-value-label');
  const findTitle = () => findDrawer().find('h2');
  const findTypeDropdown = () => wrapper.findComponent(GlFormSelect);

  describe('validations', () => {
    describe('type dropdown', () => {
      beforeEach(() => {
        createComponent({ mountFn: mountExtended });
      });

      it('adds each type option as a dropdown item', () => {
        expect(findTypeDropdown().findAll('option')).toHaveLength(variableOptions.length);

        variableOptions.forEach((v) => {
          expect(findTypeDropdown().text()).toContain(v.text);
        });
      });

      it('is set to environment variable by default', () => {
        expect(findTypeDropdown().findAll('option').at(0).attributes('value')).toBe(
          variableTypes.envType,
        );
      });

      it('renders the selected variable type', () => {
        createComponent({
          mountFn: mountExtended,
          props: {
            areEnvironmentsLoading: true,
            selectedVariable: mockProjectVariableFileType,
          },
        });

        expect(findTypeDropdown().element.value).toBe(variableTypes.fileType);
      });
    });

    describe('environment scope dropdown', () => {
      it('passes correct props to the dropdown', () => {
        createComponent({
          props: {
            areEnvironmentsLoading: true,
            selectedVariable: { ...mockProjectVariable, environmentScope: mockEnvScope },
          },
          stubs: { CiEnvironmentsDropdown },
        });

        expect(findEnvironmentScopeDropdown().props()).toMatchObject({
          areEnvironmentsLoading: true,
          environments: mockEnvironments,
          selectedEnvironmentScope: mockEnvScope,
        });
      });

      it('hides environment scope dropdown when hideEnvironmentScope is true', () => {
        createComponent({
          props: { hideEnvironmentScope: true },
          stubs: { CiEnvironmentsDropdown },
        });

        expect(findEnvironmentScopeDropdown().exists()).toBe(false);
      });

      it('disables the environment scope dropdown when areScopedVariablesAvailable is false', () => {
        createComponent({
          mountFn: mountExtended,
          props: { areScopedVariablesAvailable: false },
        });

        expect(findEnvironmentScopeDropdown().exists()).toBe(false);
        expect(findDisabledEnvironmentScopeDropdown().attributes('readonly')).toBe('readonly');
      });
    });

    describe('protected flag', () => {
      beforeEach(() => {
        createComponent();
      });

      it('is true by default when isProtectedByDefault is true', () => {
        expect(findProtectedCheckbox().attributes('checked')).toBeDefined();
      });

      it('is not checked when isProtectedByDefault is false', () => {
        createComponent({ provide: { isProtectedByDefault: false } });

        expect(findProtectedCheckbox().attributes('checked')).toBeUndefined();
      });

      it('inherits value of selected variable when editing', () => {
        createComponent({
          props: {
            selectedVariable: mockProjectVariableFileType,
            mode: EDIT_VARIABLE_ACTION,
          },
        });

        expect(findProtectedCheckbox().attributes('checked')).toBeUndefined();
      });
    });

    describe('masked flag', () => {
      beforeEach(() => {
        createComponent();
      });

      it('is false by default', () => {
        expect(findMaskedCheckbox().attributes('checked')).toBeUndefined();
      });

      it('inherits value of selected variable when editing', () => {
        createComponent({
          props: {
            selectedVariable: mockProjectVariableFileType,
            mode: EDIT_VARIABLE_ACTION,
          },
        });

        expect(findMaskedCheckbox().attributes('checked')).toBeDefined();
      });
    });

    describe('expanded flag', () => {
      beforeEach(() => {
        createComponent();
      });

      it('is true by default when adding a variable', () => {
        expect(findExpandedCheckbox().attributes('checked')).toBeDefined();
      });

      it('inherits value of selected variable when editing', () => {
        createComponent({
          props: {
            selectedVariable: mockProjectVariableFileType,
            mode: EDIT_VARIABLE_ACTION,
          },
        });

        expect(findExpandedCheckbox().attributes('checked')).toBeUndefined();
      });

      it("sets the variable's raw value", async () => {
        await findKeyField().vm.$emit('input', 'NEW_VARIABLE');
        await findExpandedCheckbox().vm.$emit('change');
        await findConfirmBtn().vm.$emit('click');

        const sentRawValue = wrapper.emitted('add-variable')[0][0].raw;
        expect(sentRawValue).toBe(!defaultProps.raw);
      });

      it('shows help text when variable is not expanded (will be evaluated as raw)', async () => {
        expect(findExpandedCheckbox().attributes('checked')).toBeDefined();
        expect(findDrawer().text()).not.toContain(
          'Variable value will be evaluated as raw string.',
        );

        await findExpandedCheckbox().vm.$emit('change');

        expect(findExpandedCheckbox().attributes('checked')).toBeUndefined();
        expect(findDrawer().text()).toContain('Variable value will be evaluated as raw string.');
      });

      it('shows help text when variable is expanded and contains the $ character', async () => {
        expect(findDrawer().text()).not.toContain(
          'Unselect "Expand variable reference" if you want to use the variable value as a raw string.',
        );

        await findValueField().vm.$emit('input', '$NEW_VALUE');

        expect(findDrawer().text()).toContain(
          'Unselect "Expand variable reference" if you want to use the variable value as a raw string.',
        );
      });
    });

    describe('key', () => {
      beforeEach(() => {
        createComponent();
      });

      it('prompts AWS tokens as options', () => {
        expect(findKeyField().props('tokenList')).toBe(awsTokenList);
      });

      it('cannot submit with empty key', async () => {
        expect(findConfirmBtn().attributes('disabled')).toBeDefined();

        await findKeyField().vm.$emit('input', 'NEW_VARIABLE');

        expect(findConfirmBtn().attributes('disabled')).toBeUndefined();
      });
    });

    describe('value', () => {
      beforeEach(() => {
        createComponent();
      });

      it('can submit empty value', async () => {
        await findKeyField().vm.$emit('input', 'NEW_VARIABLE');

        // value is empty by default
        expect(findConfirmBtn().attributes('disabled')).toBeUndefined();
      });

      const invalidValues = {
        short: 'short',
        multiLine: 'multiline\nvalue',
        unsupportedChar: 'unsupported|char',
        twoUnsupportedChars: 'unsupported|chars!',
        threeUnsupportedChars: '%unsupported|chars!',
        shortAndMultiLine: 'sho\nrt',
        shortAndUnsupportedChar: 'short!',
        shortAndMultiLineAndUnsupportedChar: 'short\n!',
        multiLineAndUnsupportedChar: 'multiline\nvalue!',
      };
      const maskedValidationIssuesText = {
        short: 'The value must have at least 8 characters.',
        multiLine:
          'This value cannot be masked because it contains the following characters: whitespace characters.',
        unsupportedChar:
          'This value cannot be masked because it contains the following characters: |.',
        unsupportedDollarChar:
          'This value cannot be masked because it contains the following characters: $.',
        twoUnsupportedChars:
          'This value cannot be masked because it contains the following characters: |, !.',
        threeUnsupportedChars:
          'This value cannot be masked because it contains the following characters: %, |, !.',
        shortAndMultiLine:
          'This value cannot be masked because it contains the following characters: whitespace characters. The value must have at least 8 characters.',
        shortAndUnsupportedChar:
          'This value cannot be masked because it contains the following characters: !. The value must have at least 8 characters.',
        shortAndMultiLineAndUnsupportedChar:
          'This value cannot be masked because it contains the following characters: ! and whitespace characters. The value must have at least 8 characters.',
        multiLineAndUnsupportedChar:
          'This value cannot be masked because it contains the following characters: ! and whitespace characters.',
      };

      describe.each`
        value                                                | canSubmit | trackingErrorProperty | validationIssueKey
        ${'secretValue'}                                     | ${true}   | ${null}               | ${''}
        ${'~v@lid:symbols.'}                                 | ${true}   | ${null}               | ${''}
        ${invalidValues.short}                               | ${false}  | ${null}               | ${'short'}
        ${invalidValues.multiLine}                           | ${false}  | ${'\n'}               | ${'multiLine'}
        ${'dollar$ign'}                                      | ${false}  | ${'$'}                | ${'unsupportedDollarChar'}
        ${invalidValues.unsupportedChar}                     | ${false}  | ${'|'}                | ${'unsupportedChar'}
        ${invalidValues.twoUnsupportedChars}                 | ${false}  | ${'|!'}               | ${'twoUnsupportedChars'}
        ${invalidValues.threeUnsupportedChars}               | ${false}  | ${'%|!'}              | ${'threeUnsupportedChars'}
        ${invalidValues.shortAndMultiLine}                   | ${false}  | ${'\n'}               | ${'shortAndMultiLine'}
        ${invalidValues.shortAndUnsupportedChar}             | ${false}  | ${'!'}                | ${'shortAndUnsupportedChar'}
        ${invalidValues.shortAndMultiLineAndUnsupportedChar} | ${false}  | ${'\n!'}              | ${'shortAndMultiLineAndUnsupportedChar'}
        ${invalidValues.multiLineAndUnsupportedChar}         | ${false}  | ${'\n!'}              | ${'multiLineAndUnsupportedChar'}
      `(
        'masking requirements',
        ({ value, canSubmit, trackingErrorProperty, validationIssueKey }) => {
          beforeEach(() => {
            createComponent();

            trackingSpy = mockTracking(undefined, wrapper.element, jest.spyOn);
            findKeyField().vm.$emit('input', 'NEW_VARIABLE');
            findValueField().vm.$emit('input', value);
            findMaskedCheckbox().vm.$emit('input', true);
          });

          itif(canSubmit)(`can submit when value is ${value}`, () => {
            /* eslint-disable jest/no-standalone-expect */
            expect(findValueLabel().attributes('invalid-feedback')).toBe('');
            expect(findConfirmBtn().attributes('disabled')).toBeUndefined();
            /* eslint-enable jest/no-standalone-expect */
          });

          itif(!canSubmit)(
            `shows validation errors and disables submit button when value is ${value}`,
            () => {
              const validationIssueText = maskedValidationIssuesText[validationIssueKey] || '';

              /* eslint-disable jest/no-standalone-expect */
              expect(findValueLabel().attributes('invalid-feedback')).toBe(validationIssueText);
              expect(findConfirmBtn().attributes('disabled')).toBeDefined();
              /* eslint-enable jest/no-standalone-expect */
            },
          );

          itif(trackingErrorProperty)(
            `sends the correct variable validation tracking event when value is ${value}`,
            () => {
              /* eslint-disable jest/no-standalone-expect */
              expect(trackingSpy).toHaveBeenCalledTimes(1);
              expect(trackingSpy).toHaveBeenCalledWith(undefined, EVENT_ACTION, {
                label: DRAWER_EVENT_LABEL,
                property: trackingErrorProperty,
              });
              /* eslint-enable jest/no-standalone-expect */
            },
          );

          itif(!trackingErrorProperty)(
            `does not send the the correct variable validation tracking event when value is ${value}`,
            () => {
              // eslint-disable-next-line jest/no-standalone-expect
              expect(trackingSpy).toHaveBeenCalledTimes(0);
            },
          );
        },
      );

      it('only sends the tracking event once', async () => {
        trackingSpy = mockTracking(undefined, wrapper.element, jest.spyOn);
        await findKeyField().vm.$emit('input', 'NEW_VARIABLE');
        await findMaskedCheckbox().vm.$emit('input', true);

        expect(trackingSpy).toHaveBeenCalledTimes(0);

        await findValueField().vm.$emit('input', 'unsupported|char');

        expect(trackingSpy).toHaveBeenCalledTimes(1);

        await findValueField().vm.$emit('input', 'dollar$ign');

        expect(trackingSpy).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('drawer events', () => {
    it('emits `search-environment-scope` before mounting', () => {
      createComponent();

      expect(wrapper.emitted('search-environment-scope')).toHaveLength(1);
      expect(wrapper.emitted('search-environment-scope')).toEqual([['']]);
    });

    it('emits `close-form` when closing the drawer', async () => {
      createComponent();

      expect(wrapper.emitted('close-form')).toBeUndefined();

      await findDrawer().vm.$emit('close');

      expect(wrapper.emitted('close-form')).toHaveLength(1);
    });

    describe('when adding a variable', () => {
      beforeEach(() => {
        createComponent({ stubs: { GlDrawer } });
      });

      it('title and confirm button renders the correct text', () => {
        expect(findTitle().text()).toBe('Add variable');
        expect(findConfirmBtn().text()).toBe('Add variable');
      });

      it('does not render delete button', () => {
        expect(findDeleteBtn().exists()).toBe(false);
      });

      it('dispatches the add-variable event', async () => {
        await findKeyField().vm.$emit('input', 'NEW_VARIABLE');
        await findProtectedCheckbox().vm.$emit('input', false);
        await findExpandedCheckbox().vm.$emit('input', true);
        await findMaskedCheckbox().vm.$emit('input', true);
        await findValueField().vm.$emit('input', 'NEW_VALUE');

        findConfirmBtn().vm.$emit('click');

        expect(wrapper.emitted('add-variable')).toEqual([
          [
            {
              environmentScope: '*',
              key: 'NEW_VARIABLE',
              masked: true,
              protected: false,
              raw: false, // opposite of expanded
              value: 'NEW_VALUE',
              variableType: 'ENV_VAR',
            },
          ],
        ]);
      });
    });

    describe('when editing a variable', () => {
      beforeEach(() => {
        createComponent({
          props: { mode: EDIT_VARIABLE_ACTION, selectedVariable: mockProjectVariableFileType },
          stubs: { GlDrawer },
        });
      });

      it('title and confirm button renders the correct text', () => {
        expect(findTitle().text()).toBe('Edit variable');
        expect(findConfirmBtn().text()).toBe('Edit variable');
      });

      it('dispatches the edit-variable event', async () => {
        await findValueField().vm.$emit('input', 'EDITED_VALUE');

        findConfirmBtn().vm.$emit('click');

        expect(wrapper.emitted('update-variable')).toEqual([
          [
            {
              ...mockProjectVariableFileType,
              value: 'EDITED_VALUE',
            },
          ],
        ]);
      });
    });

    describe('when deleting a variable', () => {
      beforeEach(() => {
        createComponent({
          mountFn: mountExtended,
          props: { mode: EDIT_VARIABLE_ACTION, selectedVariable: mockProjectVariableFileType },
        });
      });

      it('bubbles up the delete-variable event', async () => {
        findDeleteBtn().vm.$emit('click');

        await nextTick();

        findConfirmDeleteModal().vm.$emit('primary');

        expect(wrapper.emitted('delete-variable')).toEqual([[mockProjectVariableFileType]]);
      });
    });

    describe('environment scope events', () => {
      beforeEach(() => {
        createComponent({
          mountFn: mountExtended,
          props: {
            mode: EDIT_VARIABLE_ACTION,
            selectedVariable: mockProjectVariableFileType,
            areScopedVariablesAvailable: true,
            hideEnvironmentScope: false,
          },
        });
      });

      it('sets the environment scope', async () => {
        await findEnvironmentScopeDropdown().vm.$emit('select-environment', 'staging');
        await findConfirmBtn().vm.$emit('click');

        expect(wrapper.emitted('update-variable')).toEqual([
          [
            {
              ...mockProjectVariableFileType,
              environmentScope: 'staging',
            },
          ],
        ]);
      });

      it('bubbles up the search event', async () => {
        await findEnvironmentScopeDropdown().vm.$emit('search-environment-scope', 'staging');

        expect(wrapper.emitted('search-environment-scope')[1]).toEqual(['staging']);
      });
    });
  });
});
