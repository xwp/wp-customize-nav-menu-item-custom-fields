<?php
/**
 * Load nav menu item field examples.
 *
 * @package Customize_Nav_Menu_Item_Custom_Fields
 */

namespace Customize_Nav_Menu_Item_Custom_Fields\Examples;

/**
 * Load the examples.
 *
 * @param \WP_Customize_Manager $wp_customize Manager.
 */
function load_examples( \WP_Customize_Manager $wp_customize ) {

	// Make sure Customize Posts is active.
	if ( ! isset( $wp_customize->posts ) ) {
		return;
	}

	$example_dirs = glob( __DIR__ . '/*', \GLOB_ONLYDIR );
	foreach ( $example_dirs as $example_dir ) {
		$example_file = $example_dir . '/' . basename( $example_dir ) . '.php';
		if ( 0 === validate_file( $example_file ) && file_exists( $example_file ) ) {
			require_once $example_file;
		}
	}
}
add_action( 'customize_register', __NAMESPACE__ . '\load_examples' );
