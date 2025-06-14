import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init(settings, extension) {
        super._init(0.0, _('Hydration Reminder'));

        this._settings = settings;
        this._extension = extension;

        this._timeoutId = null;
        // track reminder state 
        this._isRunning = false;

        // icon for panel
        this._icon = new St.Icon({
            icon_name: 'appointment-new-symbolic',
            style_class: 'system-status-icon',
        });
        this.add_child(this._icon);

        this._buildMenu();
        
        // restart timer if interval is changed
        this._settings.connect('changed::reminder-interval', () => {
            if (this._isRunning) {
                this._stopTimer();
                this._startTimer();
            }
        });
    }

    _buildMenu() {
        const buttonRow = new St.BoxLayout({
            style_class: 'vitals-button-box',
            vertical: false,
            clip_to_allocation: true,
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
            x_expand: true,
        });

        // create toggle start/stop button
        this._toggleButton = this._createRoundButton('media-playback-start-symbolic', _('Toggle reminder'));
        this._toggleButton.connect('clicked', this._onToggleClicked.bind(this));
        buttonRow.add_child(this._toggleButton);

        // create preferences button
        const prefsButton = this._createRoundButton('preferences-system-symbolic', _('Preferences'));
        prefsButton.connect('clicked', () => {
            this._extension.openPreferences();
        });
        buttonRow.add_child(prefsButton);

        // wrap buttons in menu so menu doesn't highlight on hover
        const menuItem = new PopupMenu.PopupBaseMenuItem({ reactive: false });
        menuItem.actor.add_child(buttonRow);

        this.menu.addMenuItem(menuItem);
    }

    _onToggleClicked() {
        // change reminder state
        this._isRunning = !this._isRunning;

        if (this._isRunning) {
            // start reminder
            Main.notify(_('Start reminder 🟢'));
            this._setButtonIcon(this._toggleButton, 'media-playback-stop-symbolic');
            this._startTimer();
        } else {
            // stop reminder
            Main.notify(_('Stop reminder 🛑'));
            this._setButtonIcon(this._toggleButton, 'media-playback-start-symbolic');
            this._stopTimer();
        }
    }

    _startTimer() {
        const intervalMinutes = this._settings.get_int('reminder-interval');
        const intervalSeconds = intervalMinutes * 60;

        // remove timeout before creating new one
        this._stopTimer(); 
        this._timeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, intervalSeconds, () => {
            if (this._isRunning) {
                Main.notify(_('Drink some water 💧'));
                return GLib.SOURCE_CONTINUE; 
            } else {
                return GLib.SOURCE_REMOVE; 
            }
        });
    }

    _stopTimer() {
        if (this._timeoutId !== null) {
            GLib.source_remove(this._timeoutId);
            this._timeoutId = null;
        }
    }

    // create round icon button
    _createRoundButton(iconName, accessibleName = '') {
        const button = new St.Button({
            style_class: 'message-list-clear-button button vitals-button-action',
            accessible_name: accessibleName,
        });

        const icon = new St.Icon({ icon_name: iconName });
        // set icon as button content
        button.set_child(icon);

        return button;
    }

    // change icon of button
    _setButtonIcon(button, iconName) {
        if (button && button.get_child()) {
            button.get_child().icon_name = iconName;
        }
    }

    destroy() {
        this._stopTimer();
        super.destroy();
    }
});

export default class HydrationReminderExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._indicator = new Indicator(this._settings, this);
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
        this._settings = null;
    }
}