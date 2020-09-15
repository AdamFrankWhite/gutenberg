/**
 * External dependencies
 */
import {
	get,
	unescape as unescapeString,
	debounce,
	flatMap,
	repeat,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ComboboxControl } from '@wordpress/components';
import { useState, useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { buildTermsTree } from '../../utils/terms';

export function PageAttributesParent() {
	const { editPost } = useDispatch( 'core/editor' );
	const { parentPost } = useSelect(
		( select ) => {
			const { getEntityRecords } = select( 'core' );
			const { getEditedPostAttribute } = select( 'core/editor' );
			const postTypeSlug = getEditedPostAttribute( 'type' );
			const theParentID = getEditedPostAttribute( 'parent' );

			return {
				parentPost: getEntityRecords( 'postType', postTypeSlug, {
					include: [ theParentID ],
				} ),
			};
		},
		[ parent ]
	);
	const [ fieldValue, setFieldValue ] = useState(
		parentPost ? parentPost[ 0 ].title.raw : false
	);
	const { isLoading, parent, items, postType } = useSelect(
		( select ) => {
			const { getPostType, getEntityRecords } = select( 'core' );
			const { isResolving } = select( 'core/data' );
			const { getCurrentPostId, getEditedPostAttribute } = select( 'core/editor' );
			const postTypeSlug = getEditedPostAttribute( 'type' );
			const pType = getPostType( postTypeSlug );
			const postId = getCurrentPostId();
			const isHierarchical = get( pType, [ 'hierarchical' ], false );
			const query = {
				per_page: 100,
				exclude: postId,
				parent_exclude: postId,
				orderby: 'menu_order',
				order: 'asc',
				_fields: 'id,title,parent',
			};
			if (
				parentPost &&
				fieldValue &&
				( '' !== fieldValue ||
					fieldValue !== parentPost[ 0 ].title.raw )
			) {
				query.search = fieldValue;
			}
			const theParentID = getEditedPostAttribute( 'parent' );
			return {
				parent: theParentID,
				items: isHierarchical
					? getEntityRecords( 'postType', postTypeSlug, query )
					: [],
				postType: pType,
				isLoading: isResolving( 'core', 'getEntityRecords', [
					'postType',
					postTypeSlug,
					query,
				] ),
			};
		},
		[ fieldValue ]
	);

	const isHierarchical = get( postType, [ 'hierarchical' ], false );
	const parentPageLabel = get( postType, [ 'labels', 'parent_item_colon' ] );
	const pageItems = items || [];
	const getOptionsFromTree = ( tree, level = 0 ) => {
		return flatMap( tree, ( treeNode ) => [
			{
				key: treeNode.id,
				name: repeat( '— ', level ) + unescapeString( treeNode.name ),
			},
			...getOptionsFromTree( treeNode.children || [], level + 1 ),
		] );
	};
	const parentOptions = useMemo( () => {
		const tree = buildTermsTree(
			pageItems.map( ( item ) => ( {
				id: item.id,
				parent: item.parent,
				name:
					item.title && item.title.rendered
						? item.title.rendered
						: `#${ item.id } (${ __( 'no title' ) })`,
			} ) )
		);
		const opts = getOptionsFromTree( tree );

		// Ensure the current page is included in the dropdown list (except when searching).
		const foundParent = opts.findIndex( ( { key } ) => parent === key );
		if (
			opts.length > 0 &&
			foundParent < 0 &&
			parentPost &&
			parent &&
			fieldValue === parentPost[ 0 ].title.rendered
		) {
			return [
				{
					key: parentPost[ 0 ].id,
					name: parentPost[ 0 ].title.rendered,
				},
				...opts,
			];
		}
		return opts;
	}, [ parent, parentPost, pageItems ] );

	if ( ! isHierarchical || ! parentPageLabel ) {
		return null;
	}
	/**
	 * Handle user input.
	 *
	 * @param {string} inputValue The current value of the input field.
	 */
	const handleKeydown = ( { inputValue } ) => {
		setFieldValue( inputValue );
	};

	/**
	 * Handle author selection.
	 *
	 * @param {Object} value The selected Author.
	 * @param {Object} value.selectedItem The selected Author.
	 */
	const handleChange = ( { selectedItem } ) => {
		if ( ! selectedItem ) {
			return;
		}
		setFieldValue( selectedItem.name );
		editPost( { parent: selectedItem.key } );
	};

	const inputValue = parentPost ? parentPost[ 0 ].title.raw : fieldValue;
	const selected = parentPost
		? parentOptions.findIndex( ( { key } ) => parentPost[ 0 ].id === key )
		: false;
	const initialSelectedItem =
		false !== selected && parentPost && parentOptions[ selected ]
			? parentOptions[ selected ]
			: parentOptions[ 0 ];

	if ( ! fieldValue && isLoading ) {
		return null;
	}
	return (
		<ComboboxControl
			className="editor-page-attributes__parent"
			label={ parentPageLabel }
			options={ parentOptions }
			initialInputValue={ inputValue }
			onInputValueChange={ debounce( handleKeydown, 300 ) }
			onChange={ handleChange }
			initialSelectedItem={ initialSelectedItem }
			isLoading={ isLoading }
		/>
	);
}

export default PageAttributesParent;
