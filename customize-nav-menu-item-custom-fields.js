/* global jQuery, _ */
/* exported CustomizeNavMenuItemCustomFields */

var CustomizeNavMenuItemCustomFields = (function( $ ) {
	'use strict';

	var component = {
		api: null
	};

	/**
	 * Initialize functionality.
	 *
	 * @param {object} api The wp.customize object.
	 * @returns {void}
	 */
	component.init = function init( api ) {
		component.api = api;

		_.extend( component, api.Events );

		api.control.each( component.prepareCustomFields );
		api.control.bind( 'add', component.prepareCustomFields );

		// Export the component to be available at wp.customize.Menus.ItemCustomFields.
		component.api.Menus.ItemCustomFields = component;
	};

	/**
	 * Prepare custom fields.
	 *
	 * @param {wp.customize.Control} control Control.
	 */
	component.prepareCustomFields = function prepareCustomFields( control ) {
		var _onceExpanded, _triggerInit, matches, postId;

		if ( ! control.extended( component.api.Menus.MenuItemControl ) ) {
			return;
		}

		matches = control.id.match( /^nav_menu_item\[(-?\d+)]$/ );
		if ( ! matches ) {
			return;
		}
		postId = parseInt( matches[1], 10 );

		/**
		 * Trigger custom fields initialization.
		 *
		 * @returns {void}
		 */
		_triggerInit = function triggerInit() {
			var customFieldsContainer = $( '<div class="custom-fields"></div>' );
			control.container.find( '.menu-item-actions' ).before( customFieldsContainer );
			component.trigger( 'initialize', {
				postId: postId,
				postmetaSettingIdBase: 'postmeta[nav_menu_item][' + String( postId ) + ']',
				control: control,
				container: customFieldsContainer
			} );
		};

		/**
		 * Trigger once expanded.
		 *
		 * @param {Boolean} expanded Whether expanded.
		 * @returns {void}
		 */
		_onceExpanded = function onceExpanded( expanded ) {
			if ( expanded ) {
				control.expanded.unbind( _onceExpanded );
				_triggerInit();
			}
		};

		// Defer initializing custom fields until the control is embedded and expanded. This improves DOM performance.
		control.deferred.embedded.done( function() {
			if ( control.expanded.get() ) {
				_triggerInit();
			} else {
				control.expanded.bind( _onceExpanded );
			}
		} );
	};

	return component;

}( jQuery ) );
