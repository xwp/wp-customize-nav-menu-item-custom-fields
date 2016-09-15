<?php
/**
 * User Visibility.
 *
 * Basic customizer implementation of the Nav Menu Roles plugin.
 *
 * See https://github.com/helgatheviking/Nav-Menu-Roles
 *
 * @package Customize_Nav_Menu_Item_Custom_Fields
 */

namespace Customize_Nav_Menu_Item_Custom_Fields\Examples\User_Visibility;

const FIELD_TEMPLATE_ID = 'customize-nav-menu-item-user-visibility';
const META_KEY = 'user_visibility';

/**
 * Register meta in general.
 */
function register_meta() {
	\register_meta( 'post', META_KEY, array(
		'sanitize_callback' => function( $value ) {
			return sanitize_key( $value );
		},
	) );
}
add_action( 'init', __NAMESPACE__ . '\register_meta' );

/**
 * Register postmeta for customizer.
 *
 * @param \WP_Customize_Posts $customize_posts Customize Posts component.
 */
function customize_posts_register_meta( \WP_Customize_Posts $customize_posts ) {
	$customize_posts->register_post_type_meta( 'nav_menu_item', META_KEY, array(
		'transport' => 'refresh', // @todo postMessage?
	) );
}
add_action( 'customize_posts_register_meta', __NAMESPACE__ . '\customize_posts_register_meta' );

/**
 * Enqueue scripts.
 */
function customize_controls_enqueue_scripts() {
	$handle = 'customize-nav-menu-item-user-visibility';
	$src = plugins_url( 'user-visibility.js', __FILE__ );
	$deps = array( 'customize-nav-menus' );
	$ver = false;
	$in_footer = true;
	wp_enqueue_script( $handle, $src, $deps, $ver, $in_footer );

	$args = array(
		'templateId' => FIELD_TEMPLATE_ID,
		'metaKeys' => array( META_KEY ),
	);
	wp_add_inline_script(
		$handle,
		sprintf( 'CustomizeNavMenuItemUserVisibility.init( wp.customize, %s )', wp_json_encode( $args ) ),
		'after'
	);
}
add_action( 'customize_controls_enqueue_scripts', __NAMESPACE__ . '\customize_controls_enqueue_scripts' );

/**
 * Print field template.
 */
function print_field_template() {

	$visibility_choices = array(
		'' => __( 'Everyone', 'customize-nav-menu-item-custom-fields' ),
		'logged_in' => __( 'Logged-in Users', 'customize-nav-menu-item-custom-fields' ),
		'logged_out' => __( 'Logged-out users', 'customize-nav-menu-item-custom-fields' ),
	);

	?>
	<script id="tmpl-<?php echo esc_attr( FIELD_TEMPLATE_ID ); ?>" type="text/html">
		<#
		data.inputId = 'user-visibility-' + String( Math.random() );
		#>
		<p class="field-roles description description-thin">
			<label for="{{ data.inputId }}">
				<?php esc_html_e( 'User Visibility:', 'customize-nav-menu-item-custom-fields' ) ?><br>
			</label>
			<select id="{{ data.inputId }}" class="widefat" data-customize-postmeta-key-setting-link="<?php echo esc_attr( META_KEY ); ?>">
				<?php foreach ( $visibility_choices as $value => $text ) : ?>
					<option value="<?php echo esc_attr( $value ); ?>"><?php echo esc_html( $text ); ?></option>
				<?php endforeach; ?>
			</select>
		</p>
	</script>
	<?php
}
add_action( 'customize_controls_print_footer_scripts', __NAMESPACE__ . '\print_field_template' );
