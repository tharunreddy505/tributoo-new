import React, { useEffect, useRef, useState } from 'react';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import gjsPresetWebpage from 'grapesjs-preset-webpage';
import gjsBlocksBasic from 'grapesjs-blocks-basic';

const VisualBuilder = ({ initialHtml, initialCss, onSave, onClose }) => {
    const editorRef = useRef(null);
    const [editor, setEditor] = useState(null);

    useEffect(() => {
        const e = grapesjs.init({
            container: '#gjs',
            fromElement: false,
            height: 'calc(100vh - 120px)',
            width: 'auto',
            storageManager: false,
            plugins: [gjsPresetWebpage, gjsBlocksBasic],
            pluginsOpts: {
                [gjsPresetWebpage]: {},
                [gjsBlocksBasic]: {}
            },
            canvas: {
                styles: [
                    'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
                    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500;600&display=swap',
                    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
                ]
            },
            styleManager: {
                sectors: [{
                    name: 'General',
                    open: false,
                    buildProps: ['display', 'float', 'position', 'top', 'right', 'left', 'bottom']
                }, {
                    name: 'Dimension',
                    open: false,
                    buildProps: ['width', 'height', 'max-width', 'min-height', 'margin', 'padding']
                }, {
                    name: 'Typography',
                    open: false,
                    buildProps: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height', 'text-align', 'text-shadow']
                }, {
                    name: 'Decorations',
                    open: false,
                    buildProps: ['background-color', 'border-radius', 'border', 'box-shadow', 'background']
                }, {
                    name: 'Extra',
                    open: false,
                    buildProps: ['opacity', 'transition', 'perspective', 'transform']
                }, {
                    name: 'Flex',
                    open: false,
                    buildProps: ['flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'align-content', 'order', 'flex-basis', 'flex-grow', 'flex-shrink', 'align-self']
                }]
            }
        });


        // Elementor-style Container logic
        // Elementor-style Container logic
        e.DomComponents.addType('section', {
            isComponent: el => el.tagName === 'SECTION',
            model: {
                defaults: {
                    tagName: 'section',
                    traits: [
                        {
                            type: 'select',
                            label: 'Content Width',
                            name: 'content-width',
                            options: [
                                { value: 'full', name: 'Full Width' },
                                { value: 'boxed', name: 'Boxed' },
                            ]
                        },
                        {
                            type: 'text',
                            label: 'Custom Max Width (e.g. 1140px)',
                            name: 'custom-width',
                        },
                        {
                            type: 'select',
                            label: 'Direction',
                            name: 'flex-direction',
                            options: [
                                { value: 'row', name: 'Row (Horizontal)' },
                                { value: 'column', name: 'Column (Vertical)' },
                            ]
                        },
                        {
                            type: 'select',
                            label: 'Justify Content',
                            name: 'justify-content',
                            options: [
                                { value: 'flex-start', name: 'Start' },
                                { value: 'center', name: 'Center' },
                                { value: 'flex-end', name: 'End' },
                                { value: 'space-between', name: 'Space Between' },
                                { value: 'space-around', name: 'Space Around' },
                            ]
                        },
                        {
                            type: 'select',
                            label: 'Align Items',
                            name: 'align-items',
                            options: [
                                { value: 'stretch', name: 'Stretch' },
                                { value: 'flex-start', name: 'Start' },
                                { value: 'center', name: 'Center' },
                                { value: 'flex-end', name: 'End' },
                            ]
                        },
                        {
                            type: 'number',
                            label: 'Gap (px)',
                            name: 'gap',
                        },
                        {
                            type: 'text',
                            label: 'Min Height (e.g. 400px or 100vh)',
                            name: 'min-height',
                        }
                    ],
                },
                init() {
                    this.on('change:attributes:content-width', this.handleLayoutChange);
                    this.on('change:attributes:custom-width', this.handleLayoutChange);
                    this.on('change:attributes:flex-direction', this.handleLayoutChange);
                    this.on('change:attributes:justify-content', this.handleLayoutChange);
                    this.on('change:attributes:align-items', this.handleLayoutChange);
                    this.on('change:attributes:gap', this.handleLayoutChange);
                    this.on('change:attributes:min-height', this.handleLayoutChange);

                    // Initial check to apply styles only if attributes exist (prevent overwriting legacy content)
                    const attrs = this.getAttributes();
                    if (attrs['content-width'] || attrs['flex-direction'] || attrs['justify-content'] || attrs['align-items'] || attrs['gap'] || attrs['min-height']) {
                        this.handleLayoutChange();
                    }
                },
                handleLayoutChange() {
                    const attrs = this.getAttributes();
                    const widthMode = attrs['content-width'];
                    const customWidth = attrs['custom-width'];
                    const direction = attrs['flex-direction'] || 'column';
                    const justify = attrs['justify-content'] || 'flex-start';
                    const align = attrs['align-items'] || 'stretch';
                    const gap = attrs['gap'] || 0;
                    const minHeight = attrs['min-height'] || 'auto';

                    if (widthMode === 'boxed') {
                        this.addStyle({ 'max-width': customWidth || '1200px', 'margin-left': 'auto', 'margin-right': 'auto' });
                    } else {
                        this.addStyle({ 'max-width': 'none', 'margin-left': '0', 'margin-right': '0' });
                    }

                    this.addStyle({
                        'display': 'flex',
                        'flex-direction': direction,
                        'justify-content': justify,
                        'align-items': align,
                        'gap': gap + 'px',
                        'min-height': minHeight,
                        'width': '100%'
                    });
                }
            }
        });

        // Row Component Type
        e.DomComponents.addType('row', {
            isComponent: el => el.classList && el.classList.contains('row'),
            model: {
                defaults: {
                    tagName: 'div',
                    attributes: { class: 'row' },
                    droppable: '.cell, .text, .image, .video, div, p, span, h1, h2, h3, h4, h5, h6',
                    draggable: 'section, .section',
                    style: {
                        display: 'flex',
                        'min-height': '50px',
                        'width': '100%',
                    }
                }
            }
        });

        // Cell Component Type
        e.DomComponents.addType('cell', {
            isComponent: el => el.classList && el.classList.contains('cell'),
            model: {
                defaults: {
                    tagName: 'div',
                    attributes: { class: 'cell' },
                    droppable: true,
                    draggable: '.row',
                    style: {
                        'flex-grow': '1',
                        'flex-basis': '0%',
                        'min-height': '50px',
                        'padding': '10px',
                    },
                    traits: [
                        {
                            type: 'number',
                            label: 'Flex Grow',
                            name: 'flex-grow',
                            changeProp: 1,
                        }
                    ]
                },
                init() {
                    this.on('change:flex-grow', this.handleFlexChange);
                },
                handleFlexChange() {
                    this.addStyle({ 'flex-grow': this.get('flex-grow') || 1 });
                }
            }
        });

        // Add custom image component with alignment traits
        e.DomComponents.addType('image', {
            extend: 'image',
            isComponent: el => el.tagName === 'IMG',
            model: {
                defaults: {
                    traits: [
                        {
                            type: 'select',
                            label: 'Alignment',
                            name: 'align',
                            options: [
                                { value: '', name: 'Default' },
                                { value: 'left', name: 'Left' },
                                { value: 'center', name: 'Center' },
                                { value: 'right', name: 'Right' },
                            ],
                            changeProp: 1,
                        },
                        'alt',
                        'title'
                    ]
                },
                init() {
                    this.on('change:align', this.handleAlignChange);
                },
                handleAlignChange() {
                    const align = this.get('align');
                    if (align === 'center') {
                        this.addStyle({ display: 'block', 'margin-left': 'auto', 'margin-right': 'auto', 'float': 'none' });
                    } else if (align === 'right') {
                        this.addStyle({ display: 'block', 'margin-left': 'auto', 'margin-right': '0', 'float': 'none' });
                    } else if (align === 'left') {
                        this.addStyle({ display: 'block', 'margin-left': '0', 'margin-right': 'auto', 'float': 'none' });
                    } else {
                        const style = this.getStyle();
                        delete style['margin-left'];
                        delete style['margin-right'];
                        delete style['display'];
                        delete style['float'];
                        this.setStyle(style);
                    }
                }
            }
        });

        // Add custom video component with alignment traits
        e.DomComponents.addType('video', {
            extend: 'video',
            isComponent: el => el.tagName === 'VIDEO' || (el.getAttribute && el.getAttribute('data-gjs-type') === 'video'),
            model: {
                defaults: {
                    traits: [
                        {
                            type: 'select',
                            label: 'Alignment',
                            name: 'align',
                            options: [
                                { value: '', name: 'Default' },
                                { value: 'left', name: 'Left' },
                                { value: 'center', name: 'Center' },
                                { value: 'right', name: 'Right' },
                            ],
                            changeProp: 1,
                        },
                        'src',
                        'controls',
                        'autoplay',
                        'loop'
                    ]
                },
                init() {
                    this.on('change:align', this.handleAlignChange);
                },
                handleAlignChange() {
                    const align = this.get('align');
                    if (align === 'center') {
                        this.addStyle({ display: 'block', 'margin-left': 'auto', 'margin-right': 'auto' });
                    } else if (align === 'right') {
                        this.addStyle({ display: 'block', 'margin-left': 'auto', 'margin-right': '0' });
                    } else if (align === 'left') {
                        this.addStyle({ display: 'block', 'margin-left': '0', 'margin-right': 'auto' });
                    } else {
                        const style = this.getStyle();
                        delete style['margin-left'];
                        delete style['margin-right'];
                        delete style['display'];
                        this.setStyle(style);
                    }
                }
            }
        });

        // Add custom text component with alignment traits
        e.DomComponents.addType('text', {
            extend: 'text',
            isComponent: el => {
                const textTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'DIV'];
                if (!textTags.includes(el.tagName)) return false;
                
                // If it's an empty DIV or has layout classes, it shouldn't be a text component
                if (el.tagName === 'DIV') {
                    const hasLayoutClass = el.classList.contains('row') || el.classList.contains('cell') || el.classList.contains('section');
                    if (hasLayoutClass) return false;
                    
                    // If it has children elements (not just text), it's a container
                    const hasElements = Array.from(el.childNodes).some(node => node.nodeType === 1);
                    if (hasElements) return false;

                    // If it's completely empty, it might be a container placeholder
                    if (el.childNodes.length === 0) return false;
                }
                
                return el.childNodes.length <= 1;
            },
            model: {
                defaults: {
                    traits: [
                        {
                            type: 'select',
                            label: 'HTML Tag',
                            name: 'tagName',
                            options: [
                                { value: 'p', name: 'Paragraph' },
                                { value: 'h1', name: 'Heading 1' },
                                { value: 'h2', name: 'Heading 2' },
                                { value: 'h3', name: 'Heading 3' },
                                { value: 'h4', name: 'Heading 4' },
                                { value: 'h5', name: 'Heading 5' },
                                { value: 'h6', name: 'Heading 6' },
                                { value: 'span', name: 'Span' },
                                { value: 'div', name: 'Div' },
                            ],
                        },
                        {
                            type: 'select',
                            label: 'Text Alignment',
                            name: 'text-align',
                            options: [
                                { value: '', name: 'Default' },
                                { value: 'left', name: 'Left' },
                                { value: 'center', name: 'Center' },
                                { value: 'right', name: 'Right' },
                                { value: 'justify', name: 'Justify' },
                            ],
                            changeProp: 1,
                        }
                    ]
                },
                init() {
                    this.on('change:text-align', this.handleTextAlignChange);
                },
                handleTextAlignChange() {
                    const align = this.get('text-align');
                    if (align) {
                        this.addStyle({ 'text-align': align });
                    } else {
                        const style = this.getStyle();
                        delete style['text-align'];
                        this.setStyle(style);
                    }
                }
            }
        });

        // Icon Component Type
        e.DomComponents.addType('icon', {
            isComponent: el => el.tagName === 'I' || (el.classList && Array.from(el.classList).some(c => c.startsWith('fa-'))),
            model: {
                defaults: {
                    tagName: 'i',
                    attributes: { class: 'fa fa-star text-4xl' },
                    traits: [
                        {
                            type: 'text',
                            label: 'Icon Class (FontAwesome)',
                            name: 'class',
                        },
                        {
                            type: 'select',
                            label: 'Size',
                            name: 'size',
                            options: [
                                { value: 'text-2xl', name: 'Small' },
                                { value: 'text-4xl', name: 'Medium' },
                                { value: 'text-6xl', name: 'Large' },
                                { value: 'text-8xl', name: 'Extra Large' },
                            ],
                            changeProp: 1,
                        },
                        {
                            type: 'color',
                            label: 'Color',
                            name: 'color',
                            changeProp: 1,
                        }
                    ],
                    style: {
                        display: 'inline-block',
                        padding: '10px',
                        color: '#D4AF37'
                    }
                },
                init() {
                    this.on('change:size', this.handleSizeChange);
                    this.on('change:color', this.handleColorChange);
                },
                handleSizeChange() {
                    const size = this.get('size');
                    const attrs = { ...this.getAttributes() };
                    let classes = attrs.class || '';
                    // Remove existing text-XXl classes
                    classes = classes.replace(/text-(2|4|6|8)xl/g, '').trim();
                    classes += ' ' + size;
                    this.addAttributes({ class: classes.trim() });
                },
                handleColorChange() {
                    this.addStyle({ color: this.get('color') });
                }
            }
        });

        // Add custom blocks for your project
        const blockManager = e.BlockManager;

        blockManager.add('section-full', {
            label: 'Section',
            category: 'Layout',
            content: { 
                type: 'section', 
                classes: ['p-10'], 
                components: [
                    { 
                        type: 'row', 
                        components: [
                            { type: 'cell', classes: ['bg-gray-50'] }
                        ] 
                    }
                ] 
            },
            attributes: { class: 'fa fa-square-o' }
        });

        blockManager.add('memorial-grid-shortcut', {
            label: 'Memorial Grid',
            category: 'Tributtoo',
            content: '<div class="memorial-grid-placeholder p-10 border-2 border-dashed border-[#D4AF37] text-center bg-[#FAF9F6] w-full"> [memorial_grid] </div>',
            attributes: { class: 'fa fa-th' }
        });

        blockManager.add('image-block', {
            label: 'Image',
            category: 'Basic',
            content: { type: 'image', style: { width: '300px', height: 'auto' } },
            attributes: { class: 'fa fa-image' }
        });

        blockManager.add('text-block', {
            label: 'Text',
            category: 'Basic',
            content: { type: 'text', content: 'Insert your text here', style: { padding: '10px' } },
            attributes: { class: 'fa fa-font' }
        });

        blockManager.add('video-block', {
            label: 'Video',
            category: 'Basic',
            content: { type: 'video', style: { width: '100%', height: '350px' } },
            attributes: { class: 'fa fa-youtube-play' }
        });

        blockManager.add('icon-block', {
            label: 'Icon',
            category: 'Basic',
            content: { type: 'icon' },
            attributes: { class: 'fa fa-star' }
        });

        blockManager.add('icon-box', {
            label: 'Icon Box',
            category: 'Tributtoo',
            content: {
                type: 'div',
                classes: ['icon-box', 'p-6', 'text-center', 'border', 'rounded-lg', 'bg-white', 'shadow-sm'],
                components: [
                    { type: 'icon', attributes: { class: 'fa fa-heart text-4xl' }, style: { color: '#D4AF37', 'margin-bottom': '15px' } },
                    { type: 'text', content: '<h4>Your Title</h4>', style: { 'margin-bottom': '10px' } },
                    { type: 'text', content: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>', style: { color: '#666', 'font-size': '14px' } }
                ]
            },
            attributes: { class: 'fa fa-list-alt' }
        });

        // Load initial content AFTER component types are defined
        if (initialHtml) {
            // Split HTML and CSS if combined
            const styleMatch = initialHtml.match(/<style>(.*?)<\/style>/s);
            const htmlContent = initialHtml.replace(/<style>.*?<\/style>/s, '');

            if (htmlContent) {
                e.setComponents(htmlContent);
            }
            if (styleMatch && styleMatch[1]) {
                e.setStyle(styleMatch[1]);
            } else if (initialCss) {
                e.setStyle(initialCss);
            }
        }

        // Add missing traits to existing components after load
        e.on('load', () => {
            const comps = e.getWrapper().find('*');
            comps.forEach(comp => {
                const style = comp.getStyle();

                // Recognition for images/videos
                if (comp.is('image') || comp.is('video')) {
                    if (style['margin-left'] === 'auto' && style['margin-right'] === 'auto') {
                        comp.set('align', 'center', { silent: true });
                    } else if (style['margin-left'] === 'auto') {
                        comp.set('align', 'right', { silent: true });
                    } else if (style['margin-left'] === '0') {
                        comp.set('align', 'left', { silent: true });
                    }
                }

                // Recognition for text
                if (comp.is('text')) {
                    if (style['text-align']) {
                        comp.set('text-align', style['text-align'], { silent: true });
                    }
                }
            });

            // Inject visual aids for the editor
            const css = `
                .cell:empty {
                    min-height: 80px;
                    outline: 1px dashed #ccc;
                    outline-offset: -2px;
                    background-color: rgba(0,0,0,0.02);
                }
                .cell:empty::after {
                    content: 'Drop content here';
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #aaa;
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .row { min-height: 50px; }
            `;
            e.addStyle(css);
        });

        setEditor(e);

        return () => {
            if (e) e.destroy();
        };
    }, []);

    const handleSave = () => {
        if (editor) {
            const html = editor.getHtml();
            const css = editor.getCss();
            // Combine them or send them separately
            // Usually we store them separately in the DB or combine them
            const fullHtml = `<style>${css}</style>${html}`;
            onSave(fullHtml);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col h-screen">
            {/* Builder Header */}
            <div className="h-16 bg-[#1a1a1a] text-white flex items-center justify-between px-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                    <div className="text-xl font-bold font-serif text-[#D4AF37]">Tributtoo Builder</div>
                    <div className="h-6 w-[1px] bg-white/20"></div>
                    <div className="text-xs text-white/50 uppercase tracking-widest">Designing Page</div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium hover:bg-white/10 rounded transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-[#D4AF37] text-white px-6 py-2 rounded font-bold text-sm hover:bg-[#C4A027] transition-all shadow-lg shadow-[#D4AF37]/20"
                    >
                        Apply Changes
                    </button>
                </div>
            </div>

            {/* GrapesJS Container */}
            <div id="gjs" className="flex-grow overflow-hidden"></div>

            {/* Hint bar */}
            <div className="h-10 bg-[#2d2d2d] text-white/40 flex items-center px-6 text-[10px] uppercase tracking-widest justify-between">
                <div>Visual Builder Mode • Drag components from the right sidebar</div>
                <div className="flex gap-4">
                    <span>Desktop View</span>
                    <span>Tablet View</span>
                    <span>Mobile View</span>
                </div>
            </div>
        </div>
    );
};

export default VisualBuilder;
