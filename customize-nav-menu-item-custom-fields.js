/* global jQuery, _ */
/* exported CustomizeNavMenuItemCustomFields */

var CustomizeNavMenuItemCustomFields = (function( $ ) {
	'use strict';

	var component = {
		api: null,
		data: {
			metaKeys: [],
			l10n: {
				postmeta_setting_fetch_failure: ''
			}
		}
	};

	/**
	 * Initialize functionality.
	 *
	 * @param {object} api The wp.customize object.
	 * @param {object} args Args.
	 * @param {Array} args.metaKeys Registered meta keys.
	 * @returns {void}
	 */
	component.init = function init( api, args ) {
		component.api = api;

		_.extend( component, api.Events );
		_.extend( component.data, args );

		// Short-circuit if there are is no registered meta for nav_menu_items.
		if ( 0 === component.data.metaKeys.length ) {
			return;
		}

		api.section.each( component.prepareItemSettingPrefetch );
		api.section.bind( 'add', component.prepareItemSettingPrefetch );

		api.control.each( component.prepareCustomFields );
		api.control.bind( 'add', component.prepareCustomFields );

		// @todo Delete postmeta when nav menu is removed?

		// Export the component to be available at wp.customize.Menus.ItemCustomFields.
		component.api.Menus.ItemCustomFields = component;
	};

	component.itemsPostmetaSettingsPromises = {};

	/**
	 * Ensure postmeta settings for a given nav menu item.
	 *
	 * @param {Number} navMenuItemId - Post ID for the nav_menu_item.
	 * @returns {jQuery.promise} Promise.
	 */
	component.ensureItemPostmetaSettings = function fetchPostmetaSettings( navMenuItemId ) {
		var deferred, promise, request;

		if ( component.itemsPostmetaSettingsPromises[ navMenuItemId ] ) {
			return component.itemsPostmetaSettingsPromises[ navMenuItemId ];
		}

		deferred = $.Deferred();

		request = component.requestItemsPostmetaSettings( [ navMenuItemId ] );
		request.done( function( gatheredFetchedPostsData ) {
			var gatheredFetchedPostData = gatheredFetchedPostsData[ navMenuItemId ];
			if ( ! gatheredFetchedPostData || 'nav_menu_item' !== gatheredFetchedPostData.postType ) {
				deferred.reject();
				return;
			}
			deferred.resolve( gatheredFetchedPostsData[ navMenuItemId ] );
		} );
		request.fail( function() {
			deferred.reject();
		} );

		promise = deferred.promise();
		component.itemsPostmetaSettingsPromises[ navMenuItemId ] = promise;
		return promise;
	};

	component.requestItemsPostmetaSettingsTimeoutId = null;

	component.requestItemsPostmetaSettingsDeferred = null;

	component.pendingRequestPostmetaSettingsItemIds = [];

	/**
	 * Request items' postmeta settings.
	 *
	 * The calls to this function will be debounced so that only one Ajax request
	 * will be made to the server.
	 *
	 * @param {Array} navMenuItemIds Nav menu item IDs.
	 * @returns {jQuery.promise} Promise.
	 */
	component.requestItemsPostmetaSettings = function requestItemsPostmetaSettings( navMenuItemIds ) {
		var deferred;

		if ( component.requestItemsPostmetaSettingsTimeoutId ) {
			clearTimeout( component.requestItemsPostmetaSettingsTimeoutId );
			component.requestItemsPostmetaSettingsTimeoutId = null;
		}
		if ( ! component.requestItemsPostmetaSettingsDeferred ) {
			component.requestItemsPostmetaSettingsDeferred = $.Deferred();
		}
		deferred = component.requestItemsPostmetaSettingsDeferred;

		Array.prototype.push.apply(
			component.pendingRequestPostmetaSettingsItemIds,
			navMenuItemIds
		);

		component.requestItemsPostmetaSettingsTimeoutId = setTimeout( function() {
			var ensurePostsPromise = component.api.Posts.ensurePosts( component.pendingRequestPostmetaSettingsItemIds );
			component.pendingRequestPostmetaSettingsItemIds = [];
			ensurePostsPromise.done( function( gatheredFetchedPostsData ) {
				var postmetaSettings = {};

				component.api.each( function( setting ) {
					var postId, metaKey, matches;
					matches = setting.id.match( /^postmeta\[nav_menu_item]\[(-?\d+)]\[(.+?)]$/ );
					if ( matches ) {
						postId = parseInt( matches[1], 10 );
						metaKey = matches[2];
						if ( _.isUndefined( postmetaSettings[ postId ] ) ) {
							postmetaSettings[ postId ] = {};
						}
						postmetaSettings[ postId ][ metaKey ] = setting;
					}
				} );

				_.each( gatheredFetchedPostsData, function( fetchedPostData, postId ) {
					if ( ! fetchedPostData ) {
						return;
					}
					fetchedPostData.metaSettings = postmetaSettings[ postId ] || {};
				} );

				deferred.resolve( gatheredFetchedPostsData );
			} );
			ensurePostsPromise.fail( function() {
				deferred.reject();
			} );
		} );

		return deferred.promise();
	};

	/**
	 * Prepare lazy-loading postmeta settings for the nav menu items.
	 *
	 * @param {wp.customize.Section} section - Section.
	 * @returns {void}
	 */
	component.prepareItemSettingPrefetch = function prepareItemSettingPrefetch( section ) {
		var onceExpanded;

		if ( ! section.extended( component.api.Menus.MenuSection ) ) {
			return;
		}

		/**
		 * Trigger once expanded.
		 *
		 * @param {Boolean} expanded Whether expanded.
		 * @returns {void}
		 */
		onceExpanded = function onceExpandedFn( expanded ) {
			if ( expanded ) {
				section.expanded.unbind( onceExpanded );
				component.prefetchMenuItemsPostmetaSettings( section );
			}
		};

		if ( section.expanded.get() ) {
			component.prefetchMenuItemsPostmetaSettings( section );
		} else {
			section.expanded.bind( onceExpanded );
		}
	};

	/**
	 * Lazy-load postmeta settings for the items in a menu.
	 *
	 * @param {wp.customize.Menus.MenuSection} section - Menu section.
	 * @return {void}
	 */
	component.prefetchMenuItemsPostmetaSettings = function prefetchMenuItemsPostmetaSettings( section ) {
		var navMenuItemIds = [];

		component.api.each( function eachSetting( setting ) {
			var navMenuId = component.parseNavMenuItemSettingId( setting.id );
			if ( navMenuId && _.isObject( setting.get() ) && setting.get().nav_menu_term_id === section.params.menu_id ) {
				navMenuItemIds.push( navMenuId );
			}
		} );

		component.requestItemsPostmetaSettings( navMenuItemIds );
	};

	/**
	 * Parse a nav_menu_item setting ID.
	 *
	 * @param {string} settingId Setting ID.
	 * @returns {Number|null} Post ID or null if error.
	 */
	component.parseNavMenuItemSettingId = function parseNavMenuItemSettingId( settingId ) {
		var matches = settingId.match( /^nav_menu_item\[(-?\d+)]$/ );
		if ( ! matches ) {
			return null;
		}
		return parseInt( matches[1], 10 );
	};

	/**
	 * Prepare custom fields.
	 *
	 * @param {wp.customize.Control} control Control.
	 * @returns {void}
	 */
	component.prepareCustomFields = function prepareCustomFields( control ) {
		var onceExpanded;

		if ( ! control.extended( component.api.Menus.MenuItemControl ) ) {
			return;
		}

		/**
		 * Trigger once expanded.
		 *
		 * @param {Boolean} expanded Whether expanded.
		 * @returns {void}
		 */
		onceExpanded = function onceExpandedFn( expanded ) {
			if ( expanded ) {
				control.expanded.unbind( onceExpanded );
				component.initializeCustomFields( control );
			}
		};

		// Defer initializing custom fields until the control is embedded and expanded. This improves DOM performance.
		control.deferred.embedded.done( function() {
			if ( control.expanded.get() ) {
				component.initializeCustomFields( control );
			} else {
				control.expanded.bind( onceExpanded );
			}
		} );
	};

	/**
	 * Trigger custom fields initialization.
	 *
	 * @param {wp.customize.Control|wp.customize.Menus.MenuItemControl} control Nav Menu Item Control.
	 * @returns {void}
	 */
	component.initializeCustomFields = function initializeCustomFields( control ) {
		var promise, postId, matches, customFieldsContainer, loadingMessage, pendingCreationNotice;
		matches = control.id.match( /^nav_menu_item\[(-?\d+)]$/ );
		if ( ! matches ) {
			throw new Error( 'Unexpected control id: ' + control.id );
		}
		postId = parseInt( matches[1], 10 );

		customFieldsContainer = $( '<div class="custom-fields"></div>' );
		control.customFieldsContainer = customFieldsContainer;
		control.container.find( '.menu-item-actions' ).before( customFieldsContainer );

		// Postmeta cannot currently be managed for pre-inserted nav menu items, due to negative post IDs not being supported by get_post_meta().
		if ( postId <= 0 ) {
			pendingCreationNotice = $( $.trim( wp.template( 'customize-nav-menu-item-custom-fields-pending-creation-notice' )() ) );
			customFieldsContainer.append( pendingCreationNotice );
			return;
		}

		loadingMessage = $( $.trim( wp.template( 'customize-nav-menu-item-custom-fields-loading-message' )() ) );
		customFieldsContainer.append( loadingMessage );

		promise = component.ensureItemPostmetaSettings( postId );
		promise.done( function( data ) {
			component.trigger( 'initialize', {
				postId: postId,
				metaSettings: data.metaSettings,
				control: control,
				container: customFieldsContainer
			} );
		} );
		promise.fail( function() {
			var code = 'postmeta_setting_fetch_failure';
			if ( control.notifications ) {
				control.notifications.add( code, new component.api.Notification( code, {
					message: component.data.l10n.postmeta_setting_fetch_failure
				} ) );
			}
		} );
		promise.always( function() {
			loadingMessage.remove();
		} );
	};

	return component;

})( jQuery );
