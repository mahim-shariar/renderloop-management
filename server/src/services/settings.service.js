import AgencySettings from '../models/AgencySettings.js';

export async function getSettings() {
  let settings = await AgencySettings.findOne({ key: 'default' });
  if (!settings) {
    settings = await AgencySettings.create({ key: 'default' });
  }
  return settings;
}

export async function updateSettings(data) {
  const allowed = [
    'agencyName',
    'email',
    'phone',
    'address',
    'logoUrl',
    'defaultRevisionRounds',
    'defaultCurrency',
    'invoiceFooter',
  ];
  const update = {};
  for (const key of allowed) {
    if (data[key] !== undefined) update[key] = data[key];
  }
  const settings = await AgencySettings.findOneAndUpdate({ key: 'default' }, update, {
    new: true,
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  });
  return settings;
}
