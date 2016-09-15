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
	};

	/**
	 * Finalize the custom field by embedding and hooking up the events.
	 *
	 * @param {object} args - Args.
	 * @param {Number} args.postId - Post ID for nav menu item.
	 * @param {object} args.metaSettings - Postmeta settings keyed by meta key.
	 * @param {wp.customize.Control} args.control - Control.
	 * @param {jQuery} args.container - Container for custom fields.
	 * @returns {void}
	 */
	component.initializeCustomField = function initializeCustomField( args ) {
		var template, fieldContainer, hasRequiredMeta = true;

		// This is somewhat redundant and shouldn't actually happen.
		_.each( component.data.metaKeys, function( metaKey ) {
			if ( ! args.metaSettings[ metaKey ] ) {
				hasRequiredMeta = false;
			}
		} );
		if ( ! hasRequiredMeta ) {
			return;
		}

		template = wp.template( component.data.templateId );
		fieldContainer = $( template( {} ) );
		args.container.append( fieldContainer );

		fieldContainer.find( '[data-customize-postmeta-key-setting-link]' ).each( function() {
			var input, metaKey, element, setting;
			input = $( this );
			metaKey = input.data( 'customize-postmeta-key-setting-link' );
			setting = args.metaSettings[ metaKey ];

			if ( setting ) {

				// @todo Support radios.
				element = new component.api.Element( input );
				element.sync( setting );
				element.set( setting() );
			}
		} );
	};

	return component;

}( jQuery ) );
