# frozen_string_literal: true

module QA
  module Page
    module Profile
      class SSHKeys < Page::Base
        view 'app/views/profiles/keys/_form.html.haml' do
          element :key_title_field
          element :key_public_key_field
          element :add_key_button
        end

        view 'app/assets/javascripts/access_tokens/components/expires_at_field.vue' do
          element 'expiry-date-field'
        end

        view 'app/helpers/ssh_keys_helper.rb' do
          element :delete_ssh_key_button
          element :ssh_key_delete_modal
        end

        view 'app/views/profiles/keys/_key_table.html.haml' do
          element :ssh_keys_list
        end

        def add_key(public_key, title)
          click_button('Add new key')

          fill_element(:key_public_key_field, public_key)
          fill_element(:key_title_field, title)
          # Expire in 2 days just in case the key is created just before midnight
          fill_expiry_date(Date.today + 2)
          # Close the datepicker
          find_element('expiry-date-field').find('input').send_keys(:enter)

          click_element(:add_key_button)
        end

        def fill_expiry_date(date)
          date = date.strftime('%Y-%m-%d') if date.is_a?(Date)
          begin
            Date.strptime(date, '%Y-%m-%d')
          rescue ArgumentError
            raise "Expiry date must be in YYYY-MM-DD format"
          end

          fill_element('expiry-date-field', date)
        end

        def remove_key(title)
          click_link(title)

          click_element(:delete_ssh_key_button)

          # Retrying due to https://gitlab.com/gitlab-org/gitlab/-/issues/255287
          retry_on_exception do
            wait_for_animated_element(:ssh_key_delete_modal)
            within_element(:ssh_key_delete_modal) do
              click_button('Delete')
            end
          end
        end

        def keys_list
          find_element(:ssh_keys_list).text
        end
      end
    end
  end
end
