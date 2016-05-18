module Fastlane
  module Actions
    class AppNameAction < Action
      def self.run(params)
        require 'plist'
        identifier_key = 'CFBundleDisplayName'
        folder = Dir['*.xcodeproj'].first
        info_plist_path = params[:plist_path]
        raise "Couldn't find info plist file at path '#{params[:plist_path]}'".red unless File.exist?(info_plist_path)
        plist = Plist.parse_xml(info_plist_path)
        plist[identifier_key] = params[:app_name]
        plist_string = Plist::Emit.dump(plist)
        File.write(info_plist_path, plist_string)
        Helper.log.info "Updated #{params[:plist_path]} 💾.".green
      end

      #####################################################
      # @!group Documentation
      #####################################################

      def self.is_supported?(platform)
        [:ios].include?(platform)
      end

      def self.description
        'Update an app name'
      end

      def self.available_options
        [
          FastlaneCore::ConfigItem.new(key: :plist_path,
                                       env_name: "FL_UPDATE_APP_IDENTIFIER_PLIST_PATH",
                                       description: "Path to info plist, relative to your Xcode project",
                                       verify_block: proc do |value|
                                         raise "Invalid plist file".red unless value[-6..-1].downcase == ".plist"
                                       end),
          FastlaneCore::ConfigItem.new(key: :app_name,
                                       env_name: 'FL_UPDATE_APP_NAME',
                                       description: 'The app name of your app',
                                       verify_block: proc do |value|
                                          raise "No app_name".red unless (value and not value.empty?)
                                       end)
        ]
      end

      def self.authors
        ['@r0derik']
      end
    end
  end
end
