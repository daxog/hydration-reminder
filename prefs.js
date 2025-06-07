import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class HydrationPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        // create page in preferences window
        const page = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'dialog-information-symbolic',
        });
        window.add(page);

        // add interval and about section
        page.add(this._createIntervalGroup(settings));
        page.add(this._createAboutGroup());
    }

    _createIntervalGroup(settings) {
        const group = new Adw.PreferencesGroup({
            title: _('Interval'),
            description: _('Set how often you want to be reminded'),
        });

        // description of interval time
        const intervalRow = new Adw.ActionRow({
            title: _('Minutes between reminders'),
            activatable: false,
        });

        // spin button for interval of 1 - 180 minutes
        const spinButton = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 1, 
                upper: 180,
                step_increment: 1,
                page_increment: 10,
                value: settings.get_int('reminder-interval'),
            }),
            numeric: true,
            wrap: false,
            valign: Gtk.Align.CENTER,
        });

        // bind to reminder-interval
        settings.bind(
            'reminder-interval',
            spinButton,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        intervalRow.add_suffix(spinButton);
        group.add(intervalRow);

        return group;
    }

    _createAboutGroup() {
        const group = new Adw.PreferencesGroup({
            title: _('About'),
            description: _('Reminder to drink water'),
        });

        // display github link
        const aboutRow = new Adw.ActionRow({
            title: _('<a href="https://github.com/daxog/hydration-reminder">GitHub</a>'),
            subtitle: _('Want to contribute or have an issue? Click on the Github link above.'),
            selectable: false,
            activatable: false,
        });

        group.add(aboutRow);
        return group;
    }
}
