<?php
/**
 * Load nav menu item field examples.
 *
 * @package Customize_Nav_Menu_Item_Custom_Fields
 */

namespace Customize_Nav_Menu_Item_Custom_Fields\Examples;

/**
 * Load the examples if Customize Posts is loaded.
 *
 * @param array $components Components.
 * @return array Components.
 */
function load_examples( $components ) {
	if ( in_array( 'posts', $components, true ) ) {
		$example_dirs = glob( __DIR__ . '/*', \GLOB_ONLYDIR );
		foreach ( $example_dirs as $example_dir ) {
			$example_file = $example_dir . '/' . basename( $example_dir ) . '.php';
			if ( 0 === validate_file( $example_file ) && file_exists( $example_file ) ) {
				require_once $example_file;
			}
		}
	}
	return $components;
}
add_filter( 'customize_loaded_components', __NAMESPACE__ . '\load_examples', 100 );
