<?php
/**
 * Plugin Name: Customize Nav Menu Item Custom Fields
 * Version: 0.1.0
 * Description: Framework for adding custom fields in the customizer to nav menu item controls to manage related postmeta. Depends on Customize Posts.
 * Plugin URI: https://github.com/xwp/wp-customize-nav-menu-item-custom-fields
 * Author: XWP
 * Author URI: https://make.xwp.co/
 *
 * Copyright (c) 2016 XWP (https://make.xwp.co/)
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2 or, at
 * your discretion, any later version, as published by the Free
 * Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA
 *
 * @package Customize_Nav_Menu_Item_Custom_Fields
 */

namespace Customize_Nav_Menu_Item_Custom_Fields;

const CONTROL_SCRIPT_HANDLE = 'customize-nav-menu-item-custom-fields';
const CONTROL_STYLE_HANDLE  = 'customize-nav-menu-item-custom-fields';
const PREVIEW_SCRIPT_HANDLE = 'customize-nav-menu-item-custom-fields-preview';
const VERSION = '0.1.0';

/**
 * Show admin notice when Customize Posts is not active.
 */
function show_admin_notice() {
	if ( 'plugins' !== get_current_screen()->base || wp_script_is( 'customize-posts', 'registered' ) ) {
		return;
	}
	?>
	<div class="error">
		<p>
			<?php
			echo wp_kses_post( sprintf(
				__( 'The Customize Nav Menu Item Custom Fields plugin depends on the %s plugin, and naturally the Nav Menus component. Please ensure these are active.', 'customize-nav-menu-item-custom-fields' ),
				sprintf(
					'<a href="%1$s">%2$s</a>',
					'https://wordpress.org/plugins/customize-posts/',
					esc_html__( 'Customize Posts', 'customize-nav-menu-item-custom-fields' )
				)
			) ); ?>
		</p>
	</div>
	<?php
}
add_action( 'admin_notices', __NAMESPACE__ . '\show_admin_notice' );

/**
 * Enqueue script.
 *
 * @global \WP_Customize_Manager $wp_customize Manager.
 */
function customize_controls_enqueue_scripts() {

	// Short-circuit if nav menus component is disabled.
	global $wp_customize;
	if ( ! isset( $wp_customize->nav_menus ) || ! isset( $wp_customize->posts ) ) {
		return;
	}

	/**
	 * Customize Posts
	 *
	 * @var \WP_Customize_Posts $customize_posts
	 */
	$customize_posts = $wp_customize->posts;

	$src = plugins_url( 'customize-nav-menu-item-custom-fields.js', __FILE__ );
	$deps = array( 'customize-controls', 'customize-nav-menus', 'customize-posts' );
	$in_footer = true;
	wp_enqueue_script( CONTROL_SCRIPT_HANDLE, $src, $deps, VERSION, $in_footer );

	$exports = array(
		'metaKeys' => array(),
		'l10n' => array(
			'postmeta_setting_fetch_failure' => __( 'Failed to fetch custom field data.', 'customize-nav-menu-item-custom-fields' ),
		),
	);
	if ( ! empty( $customize_posts->registered_post_meta['nav_menu_item'] ) ) {
		$exports['metaKeys'] = array_keys( $customize_posts->registered_post_meta['nav_menu_item'] );
	}

	wp_add_inline_script(
		CONTROL_SCRIPT_HANDLE,
		sprintf( 'CustomizeNavMenuItemCustomFields.init( wp.customize, %s );', wp_json_encode( $exports ) ),
		'after'
	);

	$src = plugins_url( 'customize-nav-menu-item-custom-fields.css', __FILE__ );
	$deps = array( 'customize-controls' );
	wp_enqueue_style( CONTROL_STYLE_HANDLE, $src, $deps, VERSION );
};

add_action( 'customize_controls_enqueue_scripts', __NAMESPACE__ . '\customize_controls_enqueue_scripts' );

/**
 * Enqueue preview scripts.
 */
function enqueue_preview_scripts() {
	if ( ! is_customize_preview() ) {
		return;
	}

	$src = plugins_url( 'customize-nav-menu-item-custom-fields-preview.js', __FILE__ );
	$deps = array( 'customize-preview' );
	$in_footer = true;
	wp_enqueue_script( PREVIEW_SCRIPT_HANDLE, $src, $deps, VERSION, $in_footer );

	$exports = array();
	wp_add_inline_script(
		PREVIEW_SCRIPT_HANDLE,
		sprintf( 'CustomizeNavMenuItemCustomFieldsPreview.init( wp.customize, %s );', wp_json_encode( $exports ) ),
		'after'
	);
};
add_action( 'wp_enqueue_scripts', __NAMESPACE__ . '\enqueue_preview_scripts' );

/**
 * Print field template.
 */
function print_field_template() {
	?>
	<script id="tmpl-customize-nav-menu-item-custom-fields-loading-message" type="text/html">
		<p class="custom-fields-loading-message">
			<span class="spinner"></span>
			<?php esc_html_e( 'Custom fields are loading.', 'customize-nav-menu-item-custom-fields' ) ?>
		</p>
	</script>
	<?php
}
add_action( 'customize_controls_print_footer_scripts', __NAMESPACE__ . '\print_field_template' );
