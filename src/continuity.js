// What happens when the product goes away. The question buyers ask first and
// that almost no catalogue answers: will this still work in a year, can the
// vendor switch my copy off, and what do I keep when I leave.
// Each facet is optional. An absent facet means unknown, never a reassurance.

export const worksWithoutVendor = {
  yes:'Keeps working',
  partial:'Partly keeps working',
  no:'Stops working'
};

// Whether someone else can disable the copy you are already running.
export const remoteDisable = {
  none:'Cannot be switched off remotely',
  possible:'Can be switched off remotely',
  required:'Requires a licence or activation check'
};

export const dataAfterExit = {
  export:'Full export',
  limited:'Partial export',
  none:'No export described'
};

export const continuityFacets = {worksWithoutVendor,remoteDisable,dataAfterExit};

export const continuityLabels = {
  worksWithoutVendor:'If the vendor stops',
  remoteDisable:'Remote shut-off',
  dataAfterExit:'What you keep'
};

export const continuitySummary = (facet, value) =>
  value ? (continuityFacets[facet]?.[value.state] || value.state) : 'Not specified';
