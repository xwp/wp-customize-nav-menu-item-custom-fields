<?php
/**
 * Load nav menu item field examples.
 *
 * @package Customize_Nav_Menu_Item_Custom_Fields
 */

namespace Customize_Nav_Menu_Item_Custom_Fields\Examples;

/**
 * Show admin notice when Customize Posts is not active.
 */
function show_admin_notice() {
	if ( 'plugins' !== get_current_screen()->base || function_exists( '\Customize_Nav_Menu_Item_Custom_Fields\customize_controls_enqueue_scripts' ) ) {
		return;
	}
	?>
	<div class="error">
		<p>
			<?php esc_html_e( 'The Customize Nav Menu Item Custom Field Examples plugin depends on the Customize Nav Menu Item Custom Fields plugin.', 'customize-nav-menu-item-custom-fields' ); ?>
		</p>
	</div>
	<?php
}
add_action( 'admin_notices', __NAMESPACE__ . '\show_admin_notice' );

/**
 * Load examples.
 */
function load_examples() {
	if ( ! function_exists( '\Customize_Nav_Menu_Item_Custom_Fields\customize_controls_enqueue_scripts' ) ) {
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
add_filter( 'init', __NAMESPACE__ . '\load_examples' );
