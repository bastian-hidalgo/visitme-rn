const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const MODULAR_HEADERS_DIRECTIVE = "use_modular_headers!";
const DEPLOYMENT_TARGET = "15.1";
const DEPLOYMENT_TARGET_PATCH = `

  # Keep every pod and native target compatible with the minimum iOS version
  # supported by the installed Xcode toolchain.
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |configuration|
      configuration.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${DEPLOYMENT_TARGET}'
    end
  end

  installer.aggregate_targets.each do |aggregate_target|
    project = aggregate_target.user_project
    next unless project

    project.native_targets.each do |target|
      target.build_configurations.each do |configuration|
        configuration.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${DEPLOYMENT_TARGET}'
      end
    end
    project.save
  end
`;

const insertModularHeaders = (podfile) => {
  if (podfile.includes(MODULAR_HEADERS_DIRECTIVE)) {
    return podfile;
  }

  const platformLineRegex = /^(platform :ios, .*)$/m;

  if (platformLineRegex.test(podfile)) {
    return podfile.replace(
      platformLineRegex,
      `$1\n${MODULAR_HEADERS_DIRECTIVE}`,
    );
  }

  return `${MODULAR_HEADERS_DIRECTIVE}\n${podfile}`;
};

const insertDeploymentTargetPatch = (podfile) => {
  if (podfile.includes("Keep every pod and native target compatible")) {
    return podfile;
  }

  const postInstallLineRegex = /^(\s*)post_install do \|installer\|$/m;
  if (!postInstallLineRegex.test(podfile)) {
    return podfile;
  }

  return podfile.replace(postInstallLineRegex, `$&${DEPLOYMENT_TARGET_PATCH}`);
};

module.exports = function withIosModularHeaders(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile",
      );

      if (!fs.existsSync(podfilePath)) {
        return config;
      }

      const podfile = fs.readFileSync(podfilePath, "utf8");
      const updatedPodfile = insertDeploymentTargetPatch(
        insertModularHeaders(podfile),
      );

      if (updatedPodfile !== podfile) {
        fs.writeFileSync(podfilePath, updatedPodfile);
      }

      return config;
    },
  ]);
};
