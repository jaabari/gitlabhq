# frozen_string_literal: true

module TrackingHelper
  def tracking_attrs(label, action, property)
    return {} unless tracking_enabled?

    {
      data: {
        track_label: label,
        track_action: action,
        track_property: property
      }
    }
  end

  def tracking_attrs_data(label, action, property)
    tracking_attrs(label, action, property).fetch(:data, {})
  end

  private

  def tracking_enabled?
    Rails.env.production? &&
      ::Gitlab::Tracking.enabled?
  end
end
