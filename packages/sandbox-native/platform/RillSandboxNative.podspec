require 'json'

# Package root is the npm package root (two levels up from native/platform/)
package_root = File.expand_path('../..', __dir__)
package = JSON.parse(File.read(File.join(package_root, 'package.json')))

Pod::Spec.new do |s|
  # CocoaPods target/pod name must be a simple identifier (no @ or /)
  s.name         = "RillSandboxNative"
  s.version      = package['version']
  s.summary      = package['description']
  s.homepage     = package['homepage'] || "https://github.com/GoAskAway/rill"
  s.license      = package['license'] || "Apache-2.0"
  s.authors      = package['authors'] || { "Rill Team" => "team@rill.dev" }
  s.platforms    = { :ios => "13.0", :osx => "10.15", :tvos => "13.0", :visionos => "1.0" }
  s.source       = { :git => package['repository'] || "https://github.com/GoAskAway/rill.git", :tag => "v#{s.version}" }

  # Paths must be relative (CocoaPods validation requirement)
  # Podspec lives at native/platform, so package root is ../../
  s.source_files = "../../jsi/**/*.{h,cpp}"
  s.header_mappings_dir = "../../jsi"

  # QuickJS subspec - available on all platforms
  s.subspec 'QuickJS' do |quickjs|
    quickjs.source_files = [
      "../../quickjs/src/**/*.{h,cpp}",
      "../../quickjs/vendor/**/*.{h,c}"
    ]
    quickjs.private_header_files = "../../quickjs/vendor/**/*.h"
    quickjs.compiler_flags = '-DCONFIG_VERSION="2024-01-01" -DCONFIG_BIGNUM=1'
    quickjs.pod_target_xcconfig = {
      'CLANG_CXX_LANGUAGE_STANDARD' => 'c++17',
      'GCC_WARN_INHIBIT_ALL_WARNINGS' => 'YES'
    }
  end

  # JSC subspec - Apple platforms only (uses system JavaScriptCore)
  s.subspec 'JSC' do |jsc|
    jsc.source_files = [
      "../../jsc/src/**/*.{h,mm}",
      "../../jsc/src/RillSandboxNativeTurboModule.mm"
    ]
    jsc.frameworks = "JavaScriptCore"
    jsc.pod_target_xcconfig = {
      'CLANG_CXX_LANGUAGE_STANDARD' => 'c++17'
    }
  end

  # Default includes both
  s.default_subspecs = ['QuickJS', 'JSC']

  # React Native dependencies for JSI and bridging
  # NOTE: react-native-macos does not ship a `React-RCTFoundation` pod.
  # Keep dependencies minimal and compatible across Apple platforms.
  s.dependency "React-jsi"
  s.dependency "React-Core"

  # Optional: React-bridging for new architecture TurboModule support
  # s.dependency "React-bridging"
end
