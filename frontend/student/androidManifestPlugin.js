const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function androidManifestPlugin(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults.manifest;
    const app = manifest.application?.[0];

    if (!app) throw new Error('Invalid AndroidManifest.xml');

    // ✅ Android 13 — require activity with rationale action
    app.activity = app.activity || [];
    app.activity.push({
      $: {
        'android:name': '.PermissionsRationaleActivity',
        'android:exported': 'true',
      },
      'intent-filter': [
        {
          action: [{ $: { 'android:name': 'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE' } }],
        },
      ],
    });

    // ✅ Android 14+ — activity-alias for permission usage view
    app['activity-alias'] = app['activity-alias'] || [];
    app['activity-alias'].push({
      $: {
        'android:name': 'ViewPermissionUsageActivity',
        'android:exported': 'true',
        'android:targetActivity': '.PermissionsRationaleActivity',
        'android:permission': 'android.permission.START_VIEW_PERMISSION_USAGE',
      },
      'intent-filter': [
        {
          action: [{ $: { 'android:name': 'android.intent.action.VIEW_PERMISSION_USAGE' } }],
          category: [{ $: { 'android:name': 'android.intent.category.HEALTH_PERMISSIONS' } }],
        },
      ],
    });

    return config;
  });
};
