/* global wp, jQuery, console */
/* exported CustomizeNavMenuItemUserVisibility */

var CustomizeNavMenuItemUserVisibility = (function( $ ) {
	'use strict';

	var component = {
		api: null,
		data: {
			metaKeys: [],
			templateId: ''
		}
	};

	/**
	 * Initialize functionality.
	 *
	 * @param {object} api The wp.customize object.
	 * @param {object} args Args.
	 * @returns {void}
	 */
	component.init = function init( api, args ) {

		if ( ! api.Menus.ItemCustomFields ) {
			console.warn( 'Missing wp.customize.Menus.ItemCustomFields' );
			return;
		}

		component.api = api;

		_.extend( component.data, args );
		if ( ! args ) {
			throw new Error( 'Missing args' );
		}

		api.Menus.ItemCustomFields.bind( 'initialize', component.initializeCustomField );

		/*
		 function() {
		 api.Menus.ItemCustomFields.oncePostmetaSettingsExist( args.metaKeys ).done( function() {
		 component.initCustomField();
		 } );
		 }
		 */
	};

	/**
	 * Prepare custom fields.
	 *
	 * @param {object} args - Args.
	 * @param {Number} args.postmetaSettingIdBase - ID base for the postmeta setting ID, e.g. postmeta[nav_menu_item][123].
	 * @returns {void}
	 */
	component.initializeCustomField = function initCustomField( args ) {

		//component.api.Menus.ItemCustomFields.ensurePostmetaSettings( args.postId, component.data.metaKeys ).done( function() {
		//	component.initCustomField();
		//} );

		var settingIds = _.map( component.data.metaKeys, function( metaKey ) {
			return args.postmetaSettingIdBase + '[' + metaKey + ']';
		} );

		component.api.apply( component.api, settingIds.concat( function uponSettingsInitialized() {
			component.finalizeCustomField( args );
		} ) );
	};

	/**
	 * Finalize the custom field by embedding and hooking up the events.
	 *
	 * @param {object} args - Args.
	 * @param {Number} args.postId - Post ID for nav menu item.
	 * @param {Number} args.postmetaSettingIdBase - ID base for the postmeta setting ID, e.g. postmeta[nav_menu_item][123].
	 * @param {wp.customize.Control} args.control - Control.
	 * @param {jQuery} args.container - Container for custom fields.
	 * @returns {void}
	 */
	component.finalizeCustomField = function embedFieldContainer( args ) {
		var template, fieldContainer;
		template = wp.template( component.data.templateId );
		fieldContainer = $( template( {} ) );
		args.container.append( fieldContainer );

		fieldContainer.find( '[data-customize-postmeta-key-setting-link]' ).each( function() {
			var input, metaKey, element, setting;
			input = $( this );
			metaKey = input.data( 'customize-postmeta-key-setting-link' );
			setting = component.api( args.postmetaSettingIdBase + '[' + metaKey + ']' );

			// @todo Support radios.
			element = new component.api.Element( input );
			element.sync( setting );
			element.set( setting() );
		} );
	};

	return component;

}( jQuery ) );
