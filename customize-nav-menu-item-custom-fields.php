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

const SCRIPT_HANDLE = 'customize-nav-menu-item-custom-fields';

/**
 * Show admin notice when Customize Posts is not active.
 */
function show_admin_notice() {
	if ( 'plugins' !== get_current_screen()->base || wp_script_is( 'customize-posts' ) ) {
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

	$src = plugins_url( 'customize-nav-menu-item-custom-fields.js', __FILE__ );
	$deps = array( 'customize-controls', 'customize-nav-menus', 'customize-posts' );
	$ver = false;
	$in_footer = true;
	wp_enqueue_script( SCRIPT_HANDLE, $src, $deps, $ver, $in_footer );

	wp_add_inline_script(
		SCRIPT_HANDLE,
		sprintf( 'wp.customize.Menus.CustomFields.init( wp.customize );' ),
		'after'
	);
};

add_action( 'customize_controls_enqueue_scripts', __NAMESPACE__ . '\customize_controls_enqueue_scripts' );
