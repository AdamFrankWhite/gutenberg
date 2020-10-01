/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	closeGlobalBlockInserter,
	createNewPost,
	deactivatePlugin,
	getAllBlockInserterItemTitles,
	insertBlock,
	openGlobalBlockInserter,
} from '@wordpress/e2e-test-utils';

describe( 'Child Blocks', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-child-blocks' );
	} );

	beforeEach( async () => {
		await createNewPost();
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-child-blocks' );
	} );

	it( 'are hidden from the global block inserter', async () => {
		await openGlobalBlockInserter();
		await expect( await getAllBlockInserterItemTitles() ).not.toContain(
			'Child Blocks Child'
		);
	} );

	it( 'shows up in a parent block', async () => {
		await insertBlock( 'Child Blocks Unrestricted Parent' );
		await closeGlobalBlockInserter();
		const frame = await page
			.frames()
			.find( ( f ) => f.name() === 'editor-content' );
		await frame.waitForSelector(
			'[data-type="test/child-blocks-unrestricted-parent"] .block-editor-default-block-appender'
		);
		await frame.click(
			'[data-type="test/child-blocks-unrestricted-parent"] .block-editor-default-block-appender'
		);
		await openGlobalBlockInserter();
		const inserterItemTitles = await getAllBlockInserterItemTitles();
		expect( inserterItemTitles ).toContain( 'Child Blocks Child' );
		expect( inserterItemTitles.length ).toBeGreaterThan( 20 );
	} );

	it( 'display in a parent block with allowedItems', async () => {
		await insertBlock( 'Child Blocks Restricted Parent' );
		await closeGlobalBlockInserter();
		const frame = await page
			.frames()
			.find( ( f ) => f.name() === 'editor-content' );
		await frame.waitForSelector(
			'[data-type="test/child-blocks-restricted-parent"] .block-editor-default-block-appender'
		);
		await frame.click(
			'[data-type="test/child-blocks-restricted-parent"] .block-editor-default-block-appender'
		);
		await openGlobalBlockInserter();
		expect( await getAllBlockInserterItemTitles() ).toEqual( [
			'Child Blocks Child',
			'Image',
			'Paragraph',
		] );
	} );
} );
