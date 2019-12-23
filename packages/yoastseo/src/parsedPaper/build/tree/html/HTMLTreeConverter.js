import { FormattingElement, Heading, Paragraph, StructuredNode, List, ListItem } from "../../../structure/tree";
import LeafNode from "../../../structure/tree/nodes/LeafNode";
import { formattingElements, headings, ignoredHtmlElements } from "./htmlConstants";

/**
 * Converts a parse5 tree to a tree that can be analyzed.
 */
class HTMLTreeConverter {
	/**
	 * Converts the parse5 tree to a Yoast tree.
	 *
	 * @param {Object} parse5Tree The parse5 tree to convert.
	 *
	 * @returns {module:parsedPaper/structure.Node} The converted tree.
	 */
	convert( parse5Tree ) {
		const root = new StructuredNode( "root", null );
		this._convert( parse5Tree, root );
		return root;
	}

	/**
	 * Converts the tree from a parse5 implementation to a Yoast tree.
	 *
	 * @param {Object}                                parse5Tree    The parse5 tree to convert.
	 * @param {module:parsedPaper/structure.Node}     parent        The tree in progress.
	 *
	 * @returns {void}
	 *
	 * @private
	 */
	_convert( parse5Tree, parent ) {
		if ( parse5Tree.childNodes ) {
			for ( const node of parse5Tree.childNodes ) {
				const nodeType = node.nodeName;

				let child;

				if ( ignoredHtmlElements.includes( nodeType ) ) {
					const formatting = new FormattingElement( nodeType, node.sourceCodeLocation, this._parseAttributes( node.attrs ) );
					this._addLeafNodeContent( formatting, this._addFormatting, parent, node.sourceCodeLocation );
				} else if ( nodeType === "p" ) {
					// Paragraph.
					child = new Paragraph( node.sourceCodeLocation );
				} else if ( headings.includes( nodeType ) ) {
					// Heading.
					child = new Heading( parseInt( nodeType[ 1 ], 10 ), node.sourceCodeLocation );
				} else if ( nodeType === "li" ) {
					// List item.
					child = new ListItem( node.sourceCodeLocation );
				} else if ( nodeType === "ol" || nodeType === "ul" ) {
					// List node.
					child = new List( nodeType === "ol", node.sourceCodeLocation );
				} else if ( nodeType === "#text" ) {
					child = this._addLeafNodeContent( node.value, this._addText, parent, node.sourceCodeLocation );
				} else if ( formattingElements.includes( nodeType ) ) {
					const formatting = new FormattingElement( nodeType, node.sourceCodeLocation, this._parseAttributes( node.attrs ) );
					child = this._addLeafNodeContent( formatting, this._addFormatting, parent, node.sourceCodeLocation );
				} else {
					child = new StructuredNode( nodeType, node.sourceCodeLocation );
				}

				if ( child ) {
					parent.addChild( child );
					parent = child;
				}

				this._convert( node, parent );
			}
		}
	}

	/**
	 * Adds leaf node content (text or formatting) to the tree according to a predefined strategy:
	 *
	 * If the content has a leaf node (paragraph, heading, list item) parent or ancestor: add it to this leaf node.
	 * Else: wrap the content in an implicit paragraph, and add the content to it in such a way that runs
	 * of phrasing content make up one implicit paragraph.
	 *
	 * @param {string|module:parsedPaper/structure.FormattingElement} contentToAdd The content to add.
	 * @param {function}                                              add          A function that adds the content to the specified leaf node.
	 * @param {module:parsedPaper/structure.Node}                     parent       The parent to which to try to add the content.
	 * @param {Object}                                                location     The location of the content as parsed by parse5.
	 *
	 * @returns {null|module:parsedPaper/structure.Paragraph} The implicit paragraph, if one needed to be created.
	 *
	 * @private
	 */
	_addLeafNodeContent( contentToAdd, add, parent, location ) {
		if ( parent instanceof LeafNode ) {
			add( parent, contentToAdd );
			return null;
		}

		const previousChild = this._previousChild( parent );
		const leafNodeAncestor = this._leafNodeAncestor( parent );

		if ( leafNodeAncestor instanceof Paragraph ) {
			add( leafNodeAncestor, contentToAdd );
			return null;
		} else if ( previousChild && previousChild instanceof Paragraph && previousChild.isImplicit ) {
			add( previousChild, contentToAdd );
			return null;
		}

		const child = new Paragraph( location, true );
		add( child, contentToAdd );
		return child;
	}

	/**
	 * Add text to the parent leaf node.
	 *
	 * @param {module:parsedPaper/structure.LeafNode} parent The leaf node to which to add the text.
	 * @param {string}                                text   The text to add to the node.
	 *
	 * @returns {void}
	 *
	 * @private
	 */
	_addText( parent, text ) {
		parent.appendText( text );
	}

	/**
	 * Add a formatting element to the parent leaf node.
	 *
	 * @param {module:parsedPaper/structure.LeafNode}          parent     The leaf node to which to add the formatting.
	 * @param {module:parsedPaper/structure.FormattingElement} formatting The formatting element to add.
	 *
	 * @returns {void}
	 *
	 * @private
	 */
	_addFormatting( parent, formatting ) {
		parent.addFormatting( formatting );
	}

	/**
	 * Parses the HTML element attributes from parse5's format to a plain JS object.
	 *
	 * @example
	 *
	 * const attributes = _parseAttributes( { name: "id", value: "an-id" } ) // becomes { id: "an-id" }.
	 *
	 * @param {Array<{ name: string, value: string }>} parse5attributes The attributes as parsed by parse5.
	 *
	 * @returns {Object} The parsed attributes.
	 *
	 * @private
	 */
	_parseAttributes( parse5attributes ) {
		if ( parse5attributes && parse5attributes.length > 0 ) {
			return parse5attributes.reduce( ( attributes, attribute ) => {
				attributes[ attribute.name ] = attribute.value;
				return attributes;
			}, {} );
		}
		return null;
	}

	/**
	 * Returns the last child of the given parent.
	 *
	 * @param {module:parsedPaper/structure.StructuredNode} parent The parent.
	 *
	 * @returns {module:parsedPaper/structure.Node} The parent's last child.
	 *
	 * @private
	 */
	_previousChild( parent ) {
		if ( parent.children ) {
			return parent.children[ parent.children.length - 1 ];
		}
		return null;
	}

	/**
	 * Try to find the leaf node ancestor of this node. Returns `null` if the node does not have one.
	 *
	 * @param {module:parsedPaper/structure.Node} element The node for which to find the leaf node ancestor.
	 *
	 * @returns {null|module:parsedPaper/structure.Node} The leaf node ancestor, if it has one, `null` if not.
	 *
	 * @private
	 */
	_leafNodeAncestor( element ) {
		const parent = element.parent;

		if ( ! parent ) {
			return null;
		}

		if ( element instanceof LeafNode ) {
			return parent;
		}

		return this._leafNodeAncestor( parent );
	}
}

export default HTMLTreeConverter;
