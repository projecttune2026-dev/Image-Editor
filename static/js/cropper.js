/**
 * PixelCompress PRO - Interactive Canvas Cropper & Compression Engine
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // State Management
    const state = {
        img: null,
        imgSrc: null,
        fileName: 'image',
        origWidth: 0,
        origHeight: 0,
        origSizeBytes: 0,
        
        // Transforms
        cropBox: { x: 0, y: 0, w: 0, h: 0 },
        ratio: 'free',
        rotateAngle: 0,
        flipH: false,
        flipV: false,
        scalePercent: 100,
        exactW: null,
        exactH: null,
        lockAspect: true,

        // Adjustments & Filters
        brightness: 100,
        contrast: 100,
        saturation: 100,
        sharpness: 100,
        blur: 0,
        temperature: 0,
        vignette: 0,
        filterType: 'none',
        
        // Compression
        format: 'JPEG',
        mode: 'quality', // 'quality' or 'target'
        quality: 85,
        targetKB: null,
        keepEXIF: false,
        
        // Viewport
        zoom: 1.0,
        isComparing: false,
        
        // Processed Result
        procB64: null,
        procWidth: 0,
        procHeight: 0,
        procSizeBytes: 0,
        
        // Batch
        batchQueue: [],

        // Dual Image Blender & Joiner State
        secondaryImg: null,
        secondaryImgSrc: null,
        secondaryFileName: '',
        blendConfig: {
            mode: 'overlay',
            scale: 30,
            opacity: 100,
            position: 'bottom-right',
            margin: 20,
            fade_ratio: 50,
            blend_mode: 'normal',
            direction: 'horizontal',
            gap: 0
        },

        // Annotation & Markup State
        annotation: {
            activeTool: 'select',
            brushColor: '#00f2fe',
            brushSize: 5,
            textContent: 'PixelCompress',
            fontSize: 42,
            fontFamily: 'Inter',
            textColor: '#ffffff',
            activeSticker: '⭐',
            stickerSize: 48,
            history: []
        }
    };

    // DOM Element References
    const elements = {
        // Drop & File
        dropZone: document.getElementById('dropZone'),
        canvasWorkspace: document.getElementById('canvasWorkspace'),
        mainCanvas: document.getElementById('mainCanvas'),
        annotationCanvas: document.getElementById('annotationCanvas'),
        cropOverlay: document.getElementById('cropOverlay'),
        hiddenFileInput: document.getElementById('hiddenFileInput'),
        btnOpenFile: document.getElementById('btnOpenFile'),
        btnBrowseDrop: document.getElementById('btnBrowseDrop'),
        btnQuickSave: document.getElementById('btnQuickSave'),
        btnSaveToDisk: document.getElementById('btnSaveToDisk'),
        
        // UI Customizer
        btnThemeCustomizer: document.getElementById('btnThemeCustomizer'),
        themeModalBackdrop: document.getElementById('themeModalBackdrop'),
        btnCloseThemeModal: document.getElementById('btnCloseThemeModal'),
        themePresetsGrid: document.getElementById('themePresetsGrid'),
        themeCustomColorPicker: document.getElementById('themeCustomColorPicker'),
        accentSwatchesGrid: document.getElementById('accentSwatchesGrid'),
        themeBlurSlider: document.getElementById('themeBlurSlider'),
        blurValueBadgeUI: document.getElementById('blurValueBadgeUI'),
        themeOpacitySlider: document.getElementById('themeOpacitySlider'),
        opacityValueBadgeUI: document.getElementById('opacityValueBadgeUI'),
        themeRadiusSlider: document.getElementById('themeRadiusSlider'),
        radiusValueBadgeUI: document.getElementById('radiusValueBadgeUI'),
        btnResetThemeDefaults: document.getElementById('btnResetThemeDefaults'),
        btnApplyTheme: document.getElementById('btnApplyTheme'),
        
        // Annotations & Markup
        btnUndoAnnotation: document.getElementById('btnUndoAnnotation'),
        btnClearAnnotation: document.getElementById('btnClearAnnotation'),
        annotationToolTabs: document.getElementById('annotationToolTabs'),
        panelDrawControls: document.getElementById('panelDrawControls'),
        panelTextControls: document.getElementById('panelTextControls'),
        panelStickerControls: document.getElementById('panelStickerControls'),
        brushSizeSlider: document.getElementById('brushSizeSlider'),
        brushSizeBadge: document.getElementById('brushSizeBadge'),
        brushColorPicker: document.getElementById('brushColorPicker'),
        colorPresetsGrid: document.getElementById('colorPresetsGrid'),
        annotationTextInput: document.getElementById('annotationTextInput'),
        fontSizeInput: document.getElementById('fontSizeInput'),
        fontFamilySelect: document.getElementById('fontFamilySelect'),
        textColorPicker: document.getElementById('textColorPicker'),
        btnAddTextToCanvas: document.getElementById('btnAddTextToCanvas'),
        stickerSizeSlider: document.getElementById('stickerSizeSlider'),
        stickerSizeBadge: document.getElementById('stickerSizeBadge'),
        stickerGrid: document.getElementById('stickerGrid'),
        
        // Dual Image Blender & Joiner
        btnUploadSecondary: document.getElementById('btnUploadSecondary'),
        hiddenSecondaryFileInput: document.getElementById('hiddenSecondaryFileInput'),
        secFileBox: document.getElementById('secFileBox'),
        secInfo: document.getElementById('secInfo'),
        secFileName: document.getElementById('secFileName'),
        btnClearSecondary: document.getElementById('btnClearSecondary'),
        blendModeTabs: document.getElementById('blendModeTabs'),
        panelBlendOverlay: document.getElementById('panelBlendOverlay'),
        panelBlendFade: document.getElementById('panelBlendFade'),
        panelBlendJoin: document.getElementById('panelBlendJoin'),
        pipScaleSlider: document.getElementById('pipScaleSlider'),
        pipScaleBadge: document.getElementById('pipScaleBadge'),
        pipOpacitySlider: document.getElementById('pipOpacitySlider'),
        pipOpacityBadge: document.getElementById('pipOpacityBadge'),
        pipPositionGrid: document.getElementById('pipPositionGrid'),
        fadeRatioSlider: document.getElementById('fadeRatioSlider'),
        fadeRatioBadge: document.getElementById('fadeRatioBadge'),
        selectBlendMode: document.getElementById('selectBlendMode'),
        btnJoinHorizontal: document.getElementById('btnJoinHorizontal'),
        btnJoinVertical: document.getElementById('btnJoinVertical'),
        joinGapSlider: document.getElementById('joinGapSlider'),
        joinGapBadge: document.getElementById('joinGapBadge'),

        // Controls
        ratioPresets: document.getElementById('ratioPresets'),
        btnRotateLeft: document.getElementById('btnRotateLeft'),
        btnRotateRight: document.getElementById('btnRotateRight'),
        btnFlipH: document.getElementById('btnFlipH'),
        btnFlipV: document.getElementById('btnFlipV'),
        btnResetCrop: document.getElementById('btnResetCrop'),
        
        scaleSlider: document.getElementById('scaleSlider'),
        scaleValueBadge: document.getElementById('scaleValueBadge'),
        inputExactW: document.getElementById('inputExactW'),
        inputExactH: document.getElementById('inputExactH'),
        btnLockAspect: document.getElementById('btnLockAspect'),
        iconLock: document.getElementById('iconLock'),
        btnResetDim: document.getElementById('btnResetDim'),

        brightnessSlider: document.getElementById('brightnessSlider'),
        brightnessValueBadge: document.getElementById('brightnessValueBadge'),
        contrastSlider: document.getElementById('contrastSlider'),
        contrastValueBadge: document.getElementById('contrastValueBadge'),
        saturationSlider: document.getElementById('saturationSlider'),
        saturationValueBadge: document.getElementById('saturationValueBadge'),
        sharpnessSlider: document.getElementById('sharpnessSlider'),
        sharpnessValueBadge: document.getElementById('sharpnessValueBadge'),
        blurSlider: document.getElementById('blurSlider'),
        blurValueBadge: document.getElementById('blurValueBadge'),
        temperatureSlider: document.getElementById('temperatureSlider'),
        temperatureValueBadge: document.getElementById('temperatureValueBadge'),
        vignetteSlider: document.getElementById('vignetteSlider'),
        vignetteValueBadge: document.getElementById('vignetteValueBadge'),
        filterPresets: document.getElementById('filterPresets'),
        btnResetAdjust: document.getElementById('btnResetAdjust'),
        
        selectFormat: document.getElementById('selectFormat'),
        modeQuality: document.getElementById('modeQuality'),
        modeTargetKB: document.getElementById('modeTargetKB'),
        containerQuality: document.getElementById('containerQuality'),
        containerTargetKB: document.getElementById('containerTargetKB'),
        qualitySlider: document.getElementById('qualitySlider'),
        qualityValueBadge: document.getElementById('qualityValueBadge'),
        inputTargetKB: document.getElementById('inputTargetKB'),
        switchEXIF: document.getElementById('switchEXIF'),
        
        // View Modes & Zoom
        canvasViewport: document.getElementById('canvasViewport'),
        canvasContainer: document.getElementById('canvasContainer'),
        btnZoomIn: document.getElementById('btnZoomIn'),
        btnZoomOut: document.getElementById('btnZoomOut'),
        btnZoomReset: document.getElementById('btnZoomReset'),
        btnFullscreen: document.getElementById('btnFullscreen'),
        zoomLevel: document.getElementById('zoomLevel'),
        viewModeCrop: document.getElementById('viewModeCrop'),
        viewModeCompare: document.getElementById('viewModeCompare'),
        comparisonWorkspace: document.getElementById('comparisonWorkspace'),
        imgBefore: document.getElementById('imgBefore'),
        imgAfter: document.getElementById('imgAfter'),
        afterWrapper: document.getElementById('afterWrapper'),
        comparisonSliderBar: document.getElementById('comparisonSliderBar'),
        comparisonContainer: document.getElementById('comparisonContainer'),
        
        // Metrics
        savingsCard: document.getElementById('savingsCard'),
        savingsPercent: document.getElementById('savingsPercent'),
        savingsSubtext: document.getElementById('savingsSubtext'),
        metricOrigSize: document.getElementById('metricOrigSize'),
        metricOrigDim: document.getElementById('metricOrigDim'),
        metricProcSize: document.getElementById('metricProcSize'),
        metricProcDim: document.getElementById('metricProcDim'),
        metricFormat: document.getElementById('metricFormat'),
        metricQuality: document.getElementById('metricQuality'),
        btnAddToBatch: document.getElementById('btnAddToBatch'),
        btnCopyToClipboard: document.getElementById('btnCopyToClipboard'),
        
        // Batch
        batchDrawer: document.getElementById('batchDrawer'),
        batchDrawerHeader: document.getElementById('batchDrawerHeader'),
        btnToggleDrawer: document.getElementById('btnToggleDrawer'),
        batchCountBadge: document.getElementById('batchCountBadge'),
        batchItemsContainer: document.getElementById('batchItemsContainer'),
        btnProcessBatch: document.getElementById('btnProcessBatch'),
        btnClearBatch: document.getElementById('btnClearBatch'),
        btnOpenBatch: document.getElementById('btnOpenBatch'),
        btnRemoveBG: document.getElementById('btnRemoveBG'),
        btnUpscale: document.getElementById('btnUpscale'),
        btnReplaceBG: document.getElementById('btnReplaceBG'),
        inputBGPrompt: document.getElementById('inputBGPrompt'),
        processingLoader: document.getElementById('processingLoader'),
        loaderText: document.getElementById('loaderText')
    };

    const ctx = elements.mainCanvas.getContext('2d');
    const actx = elements.annotationCanvas.getContext('2d');

    // ==========================================
    // INITIALIZATION & EVENT LISTENERS
    // ==========================================
    
    function initEvents() {
        // File Loading
        elements.btnOpenFile.addEventListener('click', openFilePicker);
        elements.btnBrowseDrop.addEventListener('click', openFilePicker);
        elements.hiddenFileInput.addEventListener('change', handleFileSelect);

        // Drag & Drop
        elements.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            elements.dropZone.classList.add('dragover');
        });
        elements.dropZone.addEventListener('dragleave', () => elements.dropZone.classList.remove('dragover'));
        elements.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            elements.dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                if (e.dataTransfer.files.length > 1) {
                    handleBatchFiles(Array.from(e.dataTransfer.files));
                } else {
                    loadImageFromFile(e.dataTransfer.files[0]);
                }
            }
        });

        // Ratio Presets
        elements.ratioPresets.addEventListener('click', (e) => {
            const btn = e.target.closest('.preset-btn');
            if (!btn) return;
            elements.ratioPresets.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.ratio = btn.dataset.ratio;
            applyRatioToCropBox();
            triggerProcess();
        });

        // Transformations
        elements.btnRotateLeft.addEventListener('click', () => { state.rotateAngle = (state.rotateAngle - 90) % 360; renderWorkspace(); triggerProcess(); });
        elements.btnRotateRight.addEventListener('click', () => { state.rotateAngle = (state.rotateAngle + 90) % 360; renderWorkspace(); triggerProcess(); });
        elements.btnFlipH.addEventListener('click', () => { state.flipH = !state.flipH; renderWorkspace(); triggerProcess(); });
        elements.btnFlipV.addEventListener('click', () => { state.flipV = !state.flipV; renderWorkspace(); triggerProcess(); });
        elements.btnResetCrop.addEventListener('click', () => { resetCropBox(); triggerProcess(); });

        // Sliders & Inputs
        elements.scaleSlider.addEventListener('input', (e) => {
            state.scalePercent = parseInt(e.target.value);
            elements.scaleValueBadge.textContent = state.scalePercent + '%';
            triggerProcess();
        });

        // Adjustments & Filters (Instant 60FPS CSS filter preview + debounced sync)
        elements.brightnessSlider.addEventListener('input', (e) => {
            state.brightness = parseInt(e.target.value);
            elements.brightnessValueBadge.value = state.brightness;
            updateLiveCanvasFilter();
            triggerProcess();
        });
        elements.contrastSlider.addEventListener('input', (e) => {
            state.contrast = parseInt(e.target.value);
            elements.contrastValueBadge.value = state.contrast;
            updateLiveCanvasFilter();
            triggerProcess();
        });
        elements.saturationSlider.addEventListener('input', (e) => {
            state.saturation = parseInt(e.target.value);
            elements.saturationValueBadge.value = state.saturation;
            updateLiveCanvasFilter();
            triggerProcess();
        });
        elements.sharpnessSlider.addEventListener('input', (e) => {
            state.sharpness = parseInt(e.target.value);
            elements.sharpnessValueBadge.value = state.sharpness;
            updateLiveCanvasFilter();
            triggerProcess();
        });
        elements.blurSlider.addEventListener('input', (e) => {
            state.blur = parseInt(e.target.value);
            elements.blurValueBadge.value = state.blur;
            updateLiveCanvasFilter();
            triggerProcess();
        });
        elements.temperatureSlider.addEventListener('input', (e) => {
            state.temperature = parseInt(e.target.value);
            elements.temperatureValueBadge.value = state.temperature;
            updateLiveCanvasFilter();
            triggerProcess();
        });
        elements.vignetteSlider.addEventListener('input', (e) => {
            state.vignette = parseInt(e.target.value);
            elements.vignetteValueBadge.value = state.vignette;
            updateLiveCanvasFilter();
            triggerProcess();
        });

        // Typed values in the badge inputs sync back to the slider + state
        function bindBadgeInput(badgeEl, sliderEl, stateKey, min, max) {
            badgeEl.addEventListener('input', (e) => {
                let val = parseInt(e.target.value);
                if (isNaN(val)) return; // let them keep typing (e.g. clearing the field)
                val = Math.max(min, Math.min(max, val));
                state[stateKey] = val;
                sliderEl.value = val;
                updateLiveCanvasFilter();
                triggerProcess();
            });
            badgeEl.addEventListener('blur', (e) => {
                // Snap back to a valid number if left empty/invalid
                let val = parseInt(e.target.value);
                if (isNaN(val)) val = state[stateKey];
                val = Math.max(min, Math.min(max, val));
                e.target.value = val;
                state[stateKey] = val;
                sliderEl.value = val;
                updateLiveCanvasFilter();
                triggerProcess();
            });
        }
        bindBadgeInput(elements.brightnessValueBadge, elements.brightnessSlider, 'brightness', 0, 200);
        bindBadgeInput(elements.contrastValueBadge, elements.contrastSlider, 'contrast', 0, 200);
        bindBadgeInput(elements.saturationValueBadge, elements.saturationSlider, 'saturation', 0, 200);
        bindBadgeInput(elements.sharpnessValueBadge, elements.sharpnessSlider, 'sharpness', 0, 200);
        bindBadgeInput(elements.blurValueBadge, elements.blurSlider, 'blur', 0, 20);
        bindBadgeInput(elements.temperatureValueBadge, elements.temperatureSlider, 'temperature', -100, 100);
        bindBadgeInput(elements.vignetteValueBadge, elements.vignetteSlider, 'vignette', 0, 100);

        elements.filterPresets.addEventListener('click', (e) => {
            const btn = e.target.closest('.preset-btn');
            if (!btn) return;
            elements.filterPresets.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.filterType = btn.dataset.filter;
            updateLiveCanvasFilter();
            triggerProcess();
        });
        elements.btnResetAdjust.addEventListener('click', () => {
            state.brightness = 100; state.contrast = 100; state.saturation = 100;
            state.sharpness = 100; state.blur = 0; state.temperature = 0; state.vignette = 0; state.filterType = 'none';
            elements.brightnessSlider.value = 100; elements.brightnessValueBadge.value = 100;
            elements.contrastSlider.value = 100; elements.contrastValueBadge.value = 100;
            elements.saturationSlider.value = 100; elements.saturationValueBadge.value = 100;
            elements.sharpnessSlider.value = 100; elements.sharpnessValueBadge.value = 100;
            elements.blurSlider.value = 0; elements.blurValueBadge.value = 0;
            elements.temperatureSlider.value = 0; elements.temperatureValueBadge.value = 0;
            elements.vignetteSlider.value = 0; elements.vignetteValueBadge.value = 0;
            elements.filterPresets.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            elements.filterPresets.querySelector('[data-filter="none"]').classList.add('active');
            updateLiveCanvasFilter();
            triggerProcess();
        });

        // Exact Dimension Handling & Aspect Locking
        elements.btnLockAspect.addEventListener('click', () => {
            state.lockAspect = !state.lockAspect;
            if (state.lockAspect) {
                elements.btnLockAspect.style.borderColor = 'var(--accent-cyan)';
                elements.btnLockAspect.style.color = 'var(--accent-cyan)';
                elements.iconLock.className = 'fa-solid fa-link';
            } else {
                elements.btnLockAspect.style.borderColor = 'var(--border-color)';
                elements.btnLockAspect.style.color = 'var(--text-muted)';
                elements.iconLock.className = 'fa-solid fa-link-slash';
            }
        });

        elements.inputExactW.addEventListener('input', (e) => {
            const val = parseInt(e.target.value) || null;
            state.exactW = val;
            if (val && state.lockAspect && state.cropBox.w > 0) {
                const currentRatio = state.cropBox.w / state.cropBox.h;
                state.exactH = Math.round(val / currentRatio);
                elements.inputExactH.value = state.exactH;
            }
            triggerProcess();
        });

        elements.inputExactH.addEventListener('input', (e) => {
            const val = parseInt(e.target.value) || null;
            state.exactH = val;
            if (val && state.lockAspect && state.cropBox.h > 0) {
                const currentRatio = state.cropBox.w / state.cropBox.h;
                state.exactW = Math.round(val * currentRatio);
                elements.inputExactW.value = state.exactW;
            }
            triggerProcess();
        });

        document.querySelectorAll('.dim-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.id === 'btnResetDim') {
                    state.exactW = null;
                    state.exactH = null;
                    elements.inputExactW.value = '';
                    elements.inputExactH.value = '';
                } else {
                    state.exactW = parseInt(btn.dataset.w);
                    state.exactH = parseInt(btn.dataset.h);
                    elements.inputExactW.value = state.exactW;
                    elements.inputExactH.value = state.exactH;
                }
                triggerProcess();
            });
        });

        elements.selectFormat.addEventListener('change', (e) => {
            state.format = e.target.value;
            elements.metricFormat.textContent = state.format;
            triggerProcess();
        });

        // Mode Toggles
        elements.modeQuality.addEventListener('click', () => {
            state.mode = 'quality';
            elements.modeQuality.classList.add('active');
            elements.modeTargetKB.classList.remove('active');
            elements.containerQuality.classList.remove('hidden');
            elements.containerTargetKB.classList.add('hidden');
            triggerProcess();
        });

        elements.modeTargetKB.addEventListener('click', () => {
            state.mode = 'target';
            elements.modeTargetKB.classList.add('active');
            elements.modeQuality.classList.remove('active');
            elements.containerTargetKB.classList.remove('hidden');
            elements.containerQuality.classList.add('hidden');
            triggerProcess();
        });

        elements.qualitySlider.addEventListener('input', (e) => {
            state.quality = parseInt(e.target.value);
            elements.qualityValueBadge.textContent = state.quality + '%';
            triggerProcess();
        });

        elements.inputTargetKB.addEventListener('change', (e) => {
            state.targetKB = parseInt(e.target.value) || null;
            triggerProcess();
        });

        document.querySelectorAll('.chip-btn').forEach(chip => {
            chip.addEventListener('click', () => {
                const kb = parseInt(chip.dataset.kb);
                state.targetKB = kb;
                elements.inputTargetKB.value = kb;
                if (state.mode !== 'target') elements.modeTargetKB.click();
                else triggerProcess();
            });
        });

        elements.switchEXIF.addEventListener('change', (e) => {
            state.keepEXIF = e.target.checked;
            triggerProcess();
        });

        // Zoom Controls
        if (elements.btnZoomIn) {
            elements.btnZoomIn.addEventListener('click', () => {
                updateZoom(state.zoom + 0.15);
            });
        }
        if (elements.btnZoomOut) {
            elements.btnZoomOut.addEventListener('click', () => {
                updateZoom(state.zoom - 0.15);
            });
        }
        if (elements.btnZoomReset) {
            elements.btnZoomReset.addEventListener('click', () => {
                updateZoom(1.0);
            });
        }

        if (elements.canvasContainer) {
            elements.canvasContainer.addEventListener('wheel', (e) => {
                if (!state.img) return;
                if (e.ctrlKey || e.metaKey || e.altKey) {
                    e.preventDefault();
                    const delta = e.deltaY < 0 ? 0.15 : -0.15;
                    updateZoom(state.zoom + delta);
                }
            }, { passive: false });
        }

        if (elements.btnFullscreen) {
            elements.btnFullscreen.addEventListener('click', toggleFullscreen);
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

        // View Mode
        elements.viewModeCrop.addEventListener('click', () => {
            state.isComparing = false;
            elements.viewModeCrop.classList.add('active');
            elements.viewModeCompare.classList.remove('active');
            elements.canvasWorkspace.classList.remove('hidden');
            elements.comparisonWorkspace.classList.add('hidden');
        });

        elements.viewModeCompare.addEventListener('click', () => {
            if (!state.img) return;
            state.isComparing = true;
            elements.viewModeCompare.classList.add('active');
            elements.viewModeCrop.classList.remove('active');
            elements.canvasWorkspace.classList.add('hidden');
            elements.comparisonWorkspace.classList.remove('hidden');
            setupComparison();
        });

        // Save & Batch Actions
        elements.btnQuickSave.addEventListener('click', saveOutputImage);
        elements.btnSaveToDisk.addEventListener('click', saveOutputImage);
        elements.btnCopyToClipboard.addEventListener('click', copyToClipboard);
        elements.btnAddToBatch.addEventListener('click', addToBatch);
        
        elements.batchDrawerHeader.addEventListener('click', () => {
            elements.batchDrawer.classList.toggle('collapsed');
        });
        elements.btnOpenBatch.addEventListener('click', () => {
            elements.hiddenFileInput.click();
        });
        elements.btnClearBatch.addEventListener('click', clearBatch);
        elements.btnProcessBatch.addEventListener('click', processBatchZIP);

        if (elements.btnRemoveBG) {
            elements.btnRemoveBG.addEventListener('click', removeBackgroundAI);
        }
        if (elements.btnUpscale) {
            elements.btnUpscale.addEventListener('click', upscaleAI);
        }
        if (elements.btnReplaceBG) {
            elements.btnReplaceBG.addEventListener('click', replaceBackgroundAI);
        }

        initCropperOverlayEvents();
        initComparisonSliderEvents();
        initAnnotationEvents();
        initBlenderEvents();
        loadSavedTheme();
        initThemeCustomizerEvents();
    }

    function upscaleAI() {
        if (!state.imgSrc) return;

        elements.processingLoader.classList.remove('hidden');
        elements.loaderText.textContent = 'Upscaling 4× with EDSR AI... (downloading model on first use)';
        if (elements.btnUpscale) elements.btnUpscale.disabled = true;
        if (elements.btnRemoveBG) elements.btnRemoveBG.disabled = true;

        fetch('/api/upscale', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_data: state.imgSrc })
        })
        .then(res => res.json())
        .then(data => {
            elements.processingLoader.classList.add('hidden');
            if (elements.btnUpscale) elements.btnUpscale.disabled = false;
            if (elements.btnRemoveBG) elements.btnRemoveBG.disabled = false;

            if (data.error) {
                alert('Upscale error: ' + data.error);
                return;
            }

            state.origSizeBytes = data.size_bytes;
            state.imgSrc = data.image_data;

            const img = new Image();
            img.onload = () => {
                state.img = img;
                state.origWidth = img.width;
                state.origHeight = img.height;
                onImageLoaded();
            };
            img.src = state.imgSrc;
        })
        .catch(err => {
            elements.processingLoader.classList.add('hidden');
            if (elements.btnUpscale) elements.btnUpscale.disabled = false;
            if (elements.btnRemoveBG) elements.btnRemoveBG.disabled = false;
            console.error('Upscale error:', err);
            alert('Error connecting to server for AI upscaling.');
        });
    }

    function removeBackgroundAI() {
        if (!state.imgSrc) return;
        
        elements.processingLoader.classList.remove('hidden');
        elements.loaderText.textContent = "Removing background with AI...";
        if (elements.btnRemoveBG) elements.btnRemoveBG.disabled = true;

        fetch('/api/remove_bg', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_data: state.imgSrc })
        })
        .then(res => res.json())
        .then(data => {
            elements.processingLoader.classList.add('hidden');
            if (elements.btnRemoveBG) elements.btnRemoveBG.disabled = false;
            
            if (data.error) {
                alert("Background removal error: " + data.error);
                return;
            }

            state.origSizeBytes = data.size_bytes;
            state.imgSrc = data.image_data;
            state.format = 'PNG';
            elements.selectFormat.value = 'PNG';
            
            const img = new Image();
            img.onload = () => {
                state.img = img;
                state.origWidth = img.width;
                state.origHeight = img.height;
                onImageLoaded();
            };
            img.src = state.imgSrc;
        })
        .catch(err => {
            elements.processingLoader.classList.add('hidden');
            if (elements.btnRemoveBG) elements.btnRemoveBG.disabled = false;
            console.error("Background removal error:", err);
            alert("Error connecting to server for background removal.");
        });
    }

    function replaceBackgroundAI() {
        if (!state.imgSrc) return;
        const promptText = elements.inputBGPrompt ? elements.inputBGPrompt.value.trim() : 'cyberpunk city background';
        
        elements.processingLoader.classList.remove('hidden');
        elements.loaderText.textContent = "Generating AI background with Gemini Imagen...";
        if (elements.btnReplaceBG) elements.btnReplaceBG.disabled = true;

        fetch('/api/replace_bg', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_data: state.imgSrc, prompt: promptText || 'sunset beach' })
        })
        .then(res => res.json())
        .then(data => {
            elements.processingLoader.classList.add('hidden');
            if (elements.btnReplaceBG) elements.btnReplaceBG.disabled = false;
            
            if (data.error) {
                alert("AI Background error: " + data.error);
                return;
            }

            state.origSizeBytes = data.size_bytes;
            state.imgSrc = data.image_data;
            
            const img = new Image();
            img.onload = () => {
                state.img = img;
                state.origWidth = img.width;
                state.origHeight = img.height;
                onImageLoaded();
            };
            img.src = state.imgSrc;
        })
        .catch(err => {
            elements.processingLoader.classList.add('hidden');
            if (elements.btnReplaceBG) elements.btnReplaceBG.disabled = false;
            console.error("AI Background Replacement error:", err);
            alert("Error connecting to server for AI Background Replacement.");
        });
    }



    function toggleFullscreen() {
        const elem = elements.canvasViewport || document.documentElement;
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    }

    function handleFullscreenChange() {
        const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
        if (elements.btnFullscreen) {
            elements.btnFullscreen.innerHTML = isFS ? '<i class="fa-solid fa-compress"></i>' : '<i class="fa-solid fa-expand"></i>';
            elements.btnFullscreen.title = isFS ? 'Exit Full Screen' : 'Toggle Full Screen';
        }
    }

    function updateZoom(newZoom) {
        if (newZoom !== undefined) {
            state.zoom = Math.max(0.25, Math.min(4.0, newZoom));
        }
        const zoomPct = Math.round(state.zoom * 100);
        if (elements.zoomLevel) {
            elements.zoomLevel.textContent = zoomPct + '%';
        }
        if (elements.canvasWorkspace) {
            elements.canvasWorkspace.style.transform = `scale(${state.zoom})`;
            elements.canvasWorkspace.style.transformOrigin = 'center center';
        }
        if (elements.comparisonContainer) {
            elements.comparisonContainer.style.transform = `scale(${state.zoom})`;
            elements.comparisonContainer.style.transformOrigin = 'center center';
        }
    }

    // ==========================================
    // FILE HANDLING
    // ==========================================

    function openFilePicker() {
        if (window.pywebview && window.pywebview.api) {
            window.pywebview.api.select_files().then(files => {
                if (files && files.length > 0) {
                    if (files.length === 1) {
                        loadImageFromPath(files[0]);
                    } else {
                        handleBatchPaths(files);
                    }
                }
            });
        } else {
            elements.hiddenFileInput.click();
        }
    }

    function handleFileSelect(e) {
        const files = Array.from(e.target.files);
        if (files.length === 1) {
            loadImageFromFile(files[0]);
        } else if (files.length > 1) {
            handleBatchFiles(files);
        }
    }

    function loadImageFromFile(file) {
        state.fileName = file.name.replace(/\.[^/.]+$/, "");
        state.origSizeBytes = file.size;
        const reader = new FileReader();
        reader.onload = (event) => {
            state.imgSrc = event.target.result;
            const img = new Image();
            img.onload = () => {
                state.img = img;
                state.origWidth = img.width;
                state.origHeight = img.height;
                onImageLoaded();
            };
            img.src = state.imgSrc;
        };
        reader.readAsDataURL(file);
    }

    function loadImageFromPath(filePath) {
        fetch('/api/load_file?path=' + encodeURIComponent(filePath))
            .then(res => res.json())
            .then(data => {
                if (data.error) alert(data.error);
                else {
                    state.fileName = data.filename;
                    state.origSizeBytes = data.size_bytes;
                    state.imgSrc = data.image_data;
                    const img = new Image();
                    img.onload = () => {
                        state.img = img;
                        state.origWidth = img.width;
                        state.origHeight = img.height;
                        onImageLoaded();
                    };
                    img.src = state.imgSrc;
                }
            });
    }

    function onImageLoaded() {
        elements.dropZone.classList.add('hidden');
        elements.canvasWorkspace.classList.remove('hidden');
        elements.btnQuickSave.disabled = false;
        elements.btnSaveToDisk.disabled = false;
        elements.btnCopyToClipboard.disabled = false;
        elements.btnAddToBatch.disabled = false;
        if (elements.btnRemoveBG) elements.btnRemoveBG.disabled = false;
        if (elements.btnUpscale) elements.btnUpscale.disabled = false;
        if (elements.btnReplaceBG) elements.btnReplaceBG.disabled = false;
        
        state.annotation.history = [];
        updateZoom(1.0);
        resetCropBox();
        renderWorkspace();
        triggerProcess();
    }

    function resetCropBox() {
        if (!state.img) return;
        const is90or270 = (Math.abs(state.rotateAngle) % 180) === 90;
        const cw = is90or270 ? state.origHeight : state.origWidth;
        const ch = is90or270 ? state.origWidth : state.origHeight;

        state.cropBox = {
            x: 0,
            y: 0,
            w: cw,
            h: ch
        };
        applyRatioToCropBox();
    }

    function applyRatioToCropBox() {
        if (!state.img || state.ratio === 'free') return;

        const is90or270 = (Math.abs(state.rotateAngle) % 180) === 90;
        const cw = is90or270 ? state.origHeight : state.origWidth;
        const ch = is90or270 ? state.origWidth : state.origHeight;

        const parts = state.ratio.split(':');
        const rw = parseFloat(parts[0]);
        const rh = parseFloat(parts[1]);
        const targetRatio = rw / rh;

        let w = state.cropBox.w;
        let h = w / targetRatio;

        if (h > ch) {
            h = ch;
            w = h * targetRatio;
        }

        state.cropBox.w = Math.round(w);
        state.cropBox.h = Math.round(h);
        state.cropBox.x = Math.max(0, Math.round((cw - w) / 2));
        state.cropBox.y = Math.max(0, Math.round((ch - h) / 2));

        updateOverlayStyle();
    }

    function updateLiveCanvasFilter() {
        if (!elements.mainCanvas) return;
        
        let filters = [];
        
        if (state.brightness !== 100) {
            filters.push(`brightness(${state.brightness}%)`);
        }
        if (state.contrast !== 100) {
            filters.push(`contrast(${state.contrast}%)`);
        }
        if (state.saturation !== 100) {
            filters.push(`saturate(${state.saturation}%)`);
        }
        if (state.sharpness !== 100) {
            const contrastBoost = 100 + (state.sharpness - 100) * 0.25;
            filters.push(`contrast(${contrastBoost.toFixed(1)}%)`);
        }
        if (state.blur > 0) {
            filters.push(`blur(${state.blur}px)`);
        }
        if (state.temperature !== 0) {
            if (state.temperature > 0) {
                filters.push(`sepia(${state.temperature * 0.3}%)`);
                filters.push(`saturate(${100 + state.temperature * 0.2}%)`);
            } else {
                filters.push(`hue-rotate(${state.temperature * 0.5}deg)`);
            }
        }
        if (state.filterType === 'grayscale') {
            filters.push('grayscale(100%)');
        } else if (state.filterType === 'sepia') {
            filters.push('sepia(100%)');
        } else if (state.filterType === 'invert') {
            filters.push('invert(100%)');
        } else if (state.filterType === 'doc_scan') {
            filters.push('contrast(160%)', 'grayscale(80%)');
        }

        const filterStr = filters.length > 0 ? filters.join(' ') : 'none';
        elements.mainCanvas.style.filter = filterStr;
        if (elements.imgAfter) {
            elements.imgAfter.style.filter = filterStr;
        }
    }

    // ==========================================
    // CANVAS & CROP OVERLAY
    // ==========================================

    function renderWorkspace() {
        if (!state.img) return;

        // Apply CSS filters to the main canvas to reflect adjustments in real-time
        let filterStr = '';
        if (state.brightness !== 100) filterStr += `brightness(${state.brightness}%) `;
        if (state.contrast !== 100) filterStr += `contrast(${state.contrast}%) `;
        if (state.saturation !== 100) filterStr += `saturate(${state.saturation}%) `;
        if (state.blur > 0) filterStr += `blur(${state.blur}px) `;
        
        const filterType = (state.filterType || 'none').toLowerCase();
        if (filterType === 'grayscale') {
            filterStr += 'grayscale(100%) ';
        } else if (filterType === 'sepia') {
            filterStr += 'sepia(100%) ';
        } else if (filterType === 'invert') {
            filterStr += 'invert(100%) ';
        } else if (filterType === 'doc_scan') {
            filterStr += 'contrast(200%) grayscale(100%) ';
        }
        
        if (state.temperature > 0) {
            filterStr += `sepia(${state.temperature * 0.4}%) saturate(${100 + state.temperature * 0.2}%) `;
        } else if (state.temperature < 0) {
            filterStr += `hue-rotate(${state.temperature * 0.15}deg) saturate(${100 + state.temperature * 0.3}%) `;
        }

        elements.mainCanvas.style.filter = filterStr || 'none';

        const is90or270 = (Math.abs(state.rotateAngle) % 180) === 90;
        const cw = is90or270 ? state.origHeight : state.origWidth;
        const ch = is90or270 ? state.origWidth : state.origHeight;

        elements.mainCanvas.width = cw;
        elements.mainCanvas.height = ch;

        ctx.save();
        ctx.clearRect(0, 0, cw, ch);

        // Center rotation inside (cw, ch)
        ctx.translate(cw / 2, ch / 2);
        ctx.rotate((state.rotateAngle * Math.PI) / 180);
        ctx.scale(state.flipH ? -1 : 1, state.flipV ? -1 : 1);

        if (state.secondaryImg && state.blendConfig.mode === 'join') {
            const dir = state.blendConfig.direction || 'horizontal';
            const gap = state.blendConfig.gap || 0;

            if (dir === 'vertical') {
                const secW = state.origWidth;
                const secH = Math.max(1, Math.round(state.secondaryImg.height * (secW / state.secondaryImg.width)));
                elements.mainCanvas.height = state.origHeight + gap + secH;
                ctx.clearRect(0, 0, elements.mainCanvas.width, elements.mainCanvas.height);

                ctx.drawImage(state.img, -state.origWidth / 2, -state.origHeight / 2, state.origWidth, state.origHeight);
                ctx.drawImage(state.secondaryImg, -state.origWidth / 2, state.origHeight / 2 + gap, secW, secH);
            } else {
                const secH = state.origHeight;
                const secW = Math.max(1, Math.round(state.secondaryImg.width * (secH / state.secondaryImg.height)));
                elements.mainCanvas.width = state.origWidth + gap + secW;
                ctx.clearRect(0, 0, elements.mainCanvas.width, elements.mainCanvas.height);

                ctx.drawImage(state.img, -state.origWidth / 2, -state.origHeight / 2, state.origWidth, state.origHeight);
                ctx.drawImage(state.secondaryImg, state.origWidth / 2 + gap, -state.origHeight / 2, secW, secH);
            }
        } else {
            // Draw primary image
            ctx.drawImage(state.img, -state.origWidth / 2, -state.origHeight / 2);

            // Draw Vignette overlay if configured
            if (state.vignette && state.vignette > 0) {
                const radius = Math.sqrt(Math.pow(state.origWidth / 2, 2) + Math.pow(state.origHeight / 2, 2));
                const grad = ctx.createRadialGradient(0, 0, radius * 0.4, 0, 0, radius);
                const opacity = state.vignette / 100;
                grad.addColorStop(0, 'rgba(0,0,0,0)');
                grad.addColorStop(1, `rgba(0,0,0,${opacity})`);
                ctx.fillStyle = grad;
                ctx.fillRect(-state.origWidth / 2, -state.origHeight / 2, state.origWidth, state.origHeight);
            }

            // Draw secondary image if loaded (Overlay or Fade)
            if (state.secondaryImg) {
                const mode = state.blendConfig.mode || 'overlay';
                if (mode === 'overlay') {
                    const scalePct = (state.blendConfig.scale || 30) / 100;
                    const opacity = (state.blendConfig.opacity !== undefined ? state.blendConfig.opacity : 100) / 100;
                    const pos = state.blendConfig.position || 'bottom-right';
                    const margin = 20;

                    const secW = Math.max(1, Math.round(state.origWidth * scalePct));
                    const secH = Math.max(1, Math.round(state.secondaryImg.height * (secW / state.secondaryImg.width)));

                    let x = -state.origWidth / 2 + margin;
                    let y = -state.origHeight / 2 + margin;

                    if (pos === 'top-right') {
                        x = state.origWidth / 2 - secW - margin;
                    } else if (pos === 'bottom-left') {
                        y = state.origHeight / 2 - secH - margin;
                    } else if (pos === 'center') {
                        x = -secW / 2;
                        y = -secH / 2;
                    } else if (pos === 'bottom-right') {
                        x = state.origWidth / 2 - secW - margin;
                        y = state.origHeight / 2 - secH - margin;
                    }

                    ctx.save();
                    ctx.globalAlpha = opacity;
                    ctx.drawImage(state.secondaryImg, x, y, secW, secH);
                    ctx.restore();
                } else if (mode === 'fade') {
                    const ratio = (state.blendConfig.fade_ratio || 50) / 100;
                    const blendMode = state.blendConfig.blend_mode || 'normal';

                    ctx.save();
                    ctx.globalAlpha = ratio;

                    if (blendMode === 'multiply') ctx.globalCompositeOperation = 'multiply';
                    else if (blendMode === 'screen') ctx.globalCompositeOperation = 'screen';
                    else if (blendMode === 'overlay') ctx.globalCompositeOperation = 'overlay';

                    ctx.drawImage(state.secondaryImg, -state.origWidth / 2, -state.origHeight / 2, state.origWidth, state.origHeight);
                    ctx.restore();
                }
            }
        }

        ctx.restore();

        redrawAnnotationCanvas();
        updateOverlayStyle();
        updateLiveCanvasFilter();
    }

    function updateOverlayStyle() {
        const is90or270 = (Math.abs(state.rotateAngle) % 180) === 90;
        const cw = is90or270 ? state.origHeight : state.origWidth;

        const box = state.cropBox;
        const cWidth = elements.mainCanvas.clientWidth || cw;
        const scaleX = cWidth / cw;

        elements.cropOverlay.style.left = (box.x * scaleX) + 'px';
        elements.cropOverlay.style.top = (box.y * scaleX) + 'px';
        elements.cropOverlay.style.width = (box.w * scaleX) + 'px';
        elements.cropOverlay.style.height = (box.h * scaleX) + 'px';
    }

    // Interactive Dragging of Crop Overlay
    let isDragging = false;
    let dragHandle = null;
    let startX = 0, startY = 0;
    let startBox = null;

    function initCropperOverlayEvents() {
        const overlay = elements.cropOverlay;

        overlay.addEventListener('mousedown', (e) => {
            isDragging = true;
            dragHandle = e.target.dataset.handle || 'move';
            startX = e.clientX;
            startY = e.clientY;
            startBox = { ...state.cropBox };
            e.stopPropagation();
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging || !state.img) return;

            const cWidth = elements.mainCanvas.clientWidth || state.origWidth;
            const scaleFactor = state.origWidth / cWidth;

            const dx = (e.clientX - startX) * scaleFactor;
            const dy = (e.clientY - startY) * scaleFactor;

            let { x, y, w, h } = startBox;

            if (dragHandle === 'move') {
                x = Math.max(0, Math.min(state.origWidth - w, x + dx));
                y = Math.max(0, Math.min(state.origHeight - h, y + dy));
            } else {
                if (dragHandle.includes('e')) w = Math.max(20, Math.min(state.origWidth - x, w + dx));
                if (dragHandle.includes('s')) h = Math.max(20, Math.min(state.origHeight - y, h + dy));
                if (dragHandle.includes('w')) {
                    const nw = Math.max(20, w - dx);
                    x = Math.max(0, x + (w - nw));
                    w = nw;
                }
                if (dragHandle.includes('n')) {
                    const nh = Math.max(20, h - dy);
                    y = Math.max(0, y + (h - nh));
                    h = nh;
                }

                if (state.ratio !== 'free') {
                    const parts = state.ratio.split(':');
                    const targetRatio = parseFloat(parts[0]) / parseFloat(parts[1]);
                    h = Math.round(w / targetRatio);
                }
            }

            state.cropBox = { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
            updateOverlayStyle();
        });

        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                triggerProcess();
            }
        });
    }

    // ==========================================
    // MARKUP & ANNOTATIONS ENGINE
    // ==========================================

    function redrawAnnotationCanvas() {
        if (!elements.annotationCanvas || !state.img) return;

        elements.annotationCanvas.width = state.origWidth;
        elements.annotationCanvas.height = state.origHeight;

        actx.clearRect(0, 0, state.origWidth, state.origHeight);

        state.annotation.history.forEach(item => {
            if (item.type === 'path' && item.points.length > 0) {
                actx.save();
                actx.strokeStyle = item.color;
                actx.lineWidth = item.size;
                actx.lineCap = 'round';
                actx.lineJoin = 'round';

                actx.beginPath();
                actx.moveTo(item.points[0].x, item.points[0].y);
                for (let i = 1; i < item.points.length; i++) {
                    actx.lineTo(item.points[i].x, item.points[i].y);
                }
                actx.stroke();
                actx.restore();
            } else if (item.type === 'text') {
                actx.save();
                actx.fillStyle = item.color;
                actx.font = `${item.size}px "${item.fontFamily}", sans-serif`;
                actx.textAlign = 'center';
                actx.textBaseline = 'middle';

                actx.shadowColor = 'rgba(0, 0, 0, 0.7)';
                actx.shadowBlur = 6;
                actx.shadowOffsetX = 2;
                actx.shadowOffsetY = 2;

                actx.fillText(item.text, item.x, item.y);
                actx.restore();
            } else if (item.type === 'sticker') {
                actx.save();
                actx.font = `${item.size}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
                actx.textAlign = 'center';
                actx.textBaseline = 'middle';

                actx.fillText(item.sticker, item.x, item.y);
                actx.restore();
            }
        });
    }

    function getCombinedImageData() {
        if (!state.img) return state.imgSrc;
        if (state.annotation.history.length === 0) return state.imgSrc;

        const offCanvas = document.createElement('canvas');
        offCanvas.width = state.origWidth;
        offCanvas.height = state.origHeight;
        const offCtx = offCanvas.getContext('2d');

        offCtx.drawImage(state.img, 0, 0);
        offCtx.drawImage(elements.annotationCanvas, 0, 0);

        return offCanvas.toDataURL('image/png');
    }

    function initAnnotationEvents() {
        // Set initial pointer events state
        elements.annotationCanvas.style.pointerEvents = 'none';
        elements.cropOverlay.style.pointerEvents = 'auto';

        elements.annotationToolTabs.addEventListener('click', (e) => {
            const btn = e.target.closest('.preset-btn');
            if (!btn) return;
            elements.annotationToolTabs.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const tool = btn.dataset.tool;
            state.annotation.activeTool = tool;

            elements.panelDrawControls.classList.toggle('hidden', tool !== 'draw');
            elements.panelTextControls.classList.toggle('hidden', tool !== 'text');
            elements.panelStickerControls.classList.toggle('hidden', tool !== 'sticker');

            elements.annotationCanvas.className = '';
            if (tool === 'draw') elements.annotationCanvas.classList.add('active-drawing');
            else if (tool === 'text') elements.annotationCanvas.classList.add('active-text');
            else if (tool === 'sticker') elements.annotationCanvas.classList.add('active-sticker');

            // Toggle pointer-events on annotation canvas
            elements.annotationCanvas.style.pointerEvents = tool === 'select' ? 'none' : 'auto';
            elements.canvasWorkspace.style.cursor = '';

            elements.cropOverlay.style.pointerEvents = tool === 'select' ? 'auto' : 'none';
        });

        elements.btnUndoAnnotation.addEventListener('click', () => {
            if (state.annotation.history.length > 0) {
                state.annotation.history.pop();
                redrawAnnotationCanvas();
                triggerProcess();
            }
        });

        elements.btnClearAnnotation.addEventListener('click', () => {
            if (state.annotation.history.length > 0) {
                state.annotation.history = [];
                redrawAnnotationCanvas();
                triggerProcess();
            }
        });

        elements.brushSizeSlider.addEventListener('input', (e) => {
            state.annotation.brushSize = parseInt(e.target.value);
            elements.brushSizeBadge.textContent = state.annotation.brushSize + 'px';
        });

        elements.brushColorPicker.addEventListener('input', (e) => {
            state.annotation.brushColor = e.target.value;
            elements.colorPresetsGrid.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        });

        elements.colorPresetsGrid.addEventListener('click', (e) => {
            const swatch = e.target.closest('.color-swatch');
            if (!swatch) return;
            elements.colorPresetsGrid.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            state.annotation.brushColor = swatch.dataset.color;
            elements.brushColorPicker.value = swatch.dataset.color;
        });

        elements.annotationTextInput.addEventListener('input', (e) => {
            state.annotation.textContent = e.target.value;
        });
        elements.fontSizeInput.addEventListener('input', (e) => {
            state.annotation.fontSize = parseInt(e.target.value) || 36;
        });
        elements.fontFamilySelect.addEventListener('change', (e) => {
            state.annotation.fontFamily = e.target.value;
        });
        elements.textColorPicker.addEventListener('input', (e) => {
            state.annotation.textColor = e.target.value;
        });

        elements.btnAddTextToCanvas.addEventListener('click', () => {
            if (!state.img || !state.annotation.textContent) return;
            state.annotation.history.push({
                type: 'text',
                text: state.annotation.textContent,
                x: Math.round(state.origWidth / 2),
                y: Math.round(state.origHeight / 2),
                color: state.annotation.textColor,
                size: state.annotation.fontSize,
                fontFamily: state.annotation.fontFamily
            });
            redrawAnnotationCanvas();
            triggerProcess();
        });

        elements.stickerSizeSlider.addEventListener('input', (e) => {
            state.annotation.stickerSize = parseInt(e.target.value);
            elements.stickerSizeBadge.textContent = state.annotation.stickerSize + 'px';
        });

        elements.stickerGrid.addEventListener('click', (e) => {
            const btn = e.target.closest('.sticker-btn');
            if (!btn) return;
            elements.stickerGrid.querySelectorAll('.sticker-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.annotation.activeSticker = btn.dataset.sticker;
        });

        let isAnnotating = false;
        let currentPath = null;
        let isDraggingAnnotation = false;
        let draggedAnnotation = null;
        let dragStartCoords = null;

        function getCanvasCoords(e) {
            const rect = elements.annotationCanvas.getBoundingClientRect();
            const scaleX = state.origWidth / rect.width;
            const scaleY = state.origHeight / rect.height;

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            return {
                x: Math.round((clientX - rect.left) * scaleX),
                y: Math.round((clientY - rect.top) * scaleY)
            };
        }

        function findAnnotationAt(x, y) {
            // Loop backwards to select the top-most item first
            for (let i = state.annotation.history.length - 1; i >= 0; i--) {
                const item = state.annotation.history[i];
                if (item.type === 'text') {
                    const size = item.size || 30;
                    const textLength = (item.text || '').length || 1;
                    const textWidth = Math.max(size * 0.6 * textLength, 40);
                    const halfW = textWidth / 2;
                    const halfH = Math.max(size, 20) / 2;
                    if (x >= item.x - halfW && x <= item.x + halfW &&
                        y >= item.y - halfH && y <= item.y + halfH) {
                        return item;
                    }
                } else if (item.type === 'sticker') {
                    const size = item.size || 40;
                    const halfW = Math.max(size, 30) / 2;
                    const halfH = Math.max(size, 30) / 2;
                    if (x >= item.x - halfW && x <= item.x + halfW &&
                        y >= item.y - halfH && y <= item.y + halfH) {
                        return item;
                    }
                } else if (item.type === 'path' && item.points && item.points.length > 0) {
                    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                    item.points.forEach(p => {
                        if (p.x < minX) minX = p.x;
                        if (p.x > maxX) maxX = p.x;
                        if (p.y < minY) minY = p.y;
                        if (p.y > maxY) maxY = p.y;
                    });
                    const padding = (item.size || 5) + 15;
                    if (x >= minX - padding && x <= maxX + padding &&
                        y >= minY - padding && y <= maxY + padding) {
                        return item;
                    }
                }
            }
            return null;
        }

        function startAnnotation(e) {
            if (!state.img) return;
            const tool = state.annotation.activeTool;
            if (tool === 'select') return;

            const coords = getCanvasCoords(e);

            if (tool === 'draw') {
                isAnnotating = true;
                currentPath = {
                    type: 'path',
                    color: state.annotation.brushColor,
                    size: state.annotation.brushSize,
                    points: [coords]
                };
                state.annotation.history.push(currentPath);
                redrawAnnotationCanvas();
            } else if (tool === 'text') {
                if (!state.annotation.textContent) return;
                state.annotation.history.push({
                    type: 'text',
                    text: state.annotation.textContent,
                    x: coords.x,
                    y: coords.y,
                    color: state.annotation.textColor,
                    size: state.annotation.fontSize,
                    fontFamily: state.annotation.fontFamily
                });
                redrawAnnotationCanvas();
                triggerProcess();
            } else if (tool === 'sticker') {
                state.annotation.history.push({
                    type: 'sticker',
                    sticker: state.annotation.activeSticker,
                    x: coords.x,
                    y: coords.y,
                    size: state.annotation.stickerSize
                });
                redrawAnnotationCanvas();
                triggerProcess();
            }
        }

        function moveAnnotation(e) {
            const tool = state.annotation.activeTool;
            if (tool === 'select') {
                if (isDraggingAnnotation && draggedAnnotation) {
                    const coords = getCanvasCoords(e);
                    const dx = coords.x - dragStartCoords.x;
                    const dy = coords.y - dragStartCoords.y;

                    if (draggedAnnotation.type === 'path') {
                        draggedAnnotation.points.forEach(p => {
                            p.x += dx;
                            p.y += dy;
                        });
                    } else {
                        draggedAnnotation.x += dx;
                        draggedAnnotation.y += dy;
                    }

                    dragStartCoords = coords;
                    redrawAnnotationCanvas();
                    triggerProcess();
                    if (e.cancelable) e.preventDefault();
                }
                return;
            }

            if (!isAnnotating || tool !== 'draw') return;
            const coords = getCanvasCoords(e);
            currentPath.points.push(coords);
            redrawAnnotationCanvas();
            if (e.cancelable) e.preventDefault();
        }

        function stopAnnotation() {
            if (isDraggingAnnotation) {
                isDraggingAnnotation = false;
                draggedAnnotation = null;
                triggerProcess();
                return;
            }
            if (isAnnotating) {
                isAnnotating = false;
                currentPath = null;
                triggerProcess();
            }
        }

        // Click/Touch intercept on workspace for selection
        elements.canvasWorkspace.addEventListener('mousedown', (e) => {
            if (state.annotation.activeTool !== 'select') return;
            const coords = getCanvasCoords(e);
            const hit = findAnnotationAt(coords.x, coords.y);
            if (hit) {
                isDraggingAnnotation = true;
                draggedAnnotation = hit;
                dragStartCoords = coords;
                e.stopPropagation();
                e.preventDefault();
            }
        }, true); // Capture phase

        elements.canvasWorkspace.addEventListener('touchstart', (e) => {
            if (state.annotation.activeTool !== 'select') return;
            const coords = getCanvasCoords(e);
            const hit = findAnnotationAt(coords.x, coords.y);
            if (hit) {
                isDraggingAnnotation = true;
                draggedAnnotation = hit;
                dragStartCoords = coords;
                e.stopPropagation();
                e.preventDefault();
            }
        }, { capture: true, passive: false });

        elements.canvasWorkspace.addEventListener('mousemove', (e) => {
            if (state.annotation.activeTool !== 'select' || isDraggingAnnotation) return;
            const coords = getCanvasCoords(e);
            const hit = findAnnotationAt(coords.x, coords.y);
            if (hit) {
                elements.canvasWorkspace.style.cursor = 'move';
            } else {
                elements.canvasWorkspace.style.cursor = '';
            }
        });

        // Annotation canvas events for drawing
        elements.annotationCanvas.addEventListener('mousedown', startAnnotation);
        window.addEventListener('mousemove', moveAnnotation);
        window.addEventListener('mouseup', stopAnnotation);

        elements.annotationCanvas.addEventListener('touchstart', (e) => {
            startAnnotation(e);
            if (isAnnotating) {
                e.preventDefault();
            }
        });
        window.addEventListener('touchmove', (e) => {
            moveAnnotation(e);
            if (isAnnotating) {
                e.preventDefault();
            }
        });
        window.addEventListener('touchend', stopAnnotation);
    }

    // ==========================================
    // DUAL IMAGE BLENDER & JOINER LOGIC
    // ==========================================

    function initBlenderEvents() {
        elements.btnUploadSecondary.addEventListener('click', () => {
            if (window.pywebview && window.pywebview.api) {
                window.pywebview.api.select_files().then(files => {
                    if (files && files.length > 0) {
                        fetch('/api/load_file?path=' + encodeURIComponent(files[0]))
                            .then(res => res.json())
                            .then(data => {
                                if (data.image_data) {
                                    state.secondaryFileName = data.filename;
                                    elements.secFileName.textContent = data.filename;
                                    elements.secInfo.classList.remove('hidden');
                                    elements.btnUploadSecondary.classList.add('hidden');

                                    state.secondaryImgSrc = data.image_data;
                                    const img = new Image();
                                    img.onload = () => {
                                        state.secondaryImg = img;
                                        renderWorkspace();
                                        triggerProcess();
                                    };
                                    img.src = state.secondaryImgSrc;
                                }
                            });
                    }
                });
            } else {
                elements.hiddenSecondaryFileInput.click();
            }
        });

        elements.hiddenSecondaryFileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                loadSecondaryFile(files[0]);
            }
        });

        elements.btnClearSecondary.addEventListener('click', () => {
            state.secondaryImg = null;
            state.secondaryImgSrc = null;
            state.secondaryFileName = '';
            elements.secInfo.classList.add('hidden');
            elements.btnUploadSecondary.classList.remove('hidden');
            elements.hiddenSecondaryFileInput.value = '';
            renderWorkspace();
            triggerProcess();
        });

        // Mode Tabs
        elements.blendModeTabs.addEventListener('click', (e) => {
            const btn = e.target.closest('.mode-btn');
            if (!btn) return;
            elements.blendModeTabs.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const mode = btn.dataset.blend;
            state.blendConfig.mode = mode;

            elements.panelBlendOverlay.classList.toggle('hidden', mode !== 'overlay');
            elements.panelBlendFade.classList.toggle('hidden', mode !== 'fade');
            elements.panelBlendJoin.classList.toggle('hidden', mode !== 'join');

            renderWorkspace();
            triggerProcess();
        });

        // Overlay PIP Sliders & Buttons
        elements.pipScaleSlider.addEventListener('input', (e) => {
            state.blendConfig.scale = parseInt(e.target.value);
            elements.pipScaleBadge.textContent = state.blendConfig.scale + '%';
            renderWorkspace();
            triggerProcess();
        });

        elements.pipOpacitySlider.addEventListener('input', (e) => {
            state.blendConfig.opacity = parseInt(e.target.value);
            elements.pipOpacityBadge.textContent = state.blendConfig.opacity + '%';
            renderWorkspace();
            triggerProcess();
        });

        elements.pipPositionGrid.addEventListener('click', (e) => {
            const btn = e.target.closest('.pos-btn');
            if (!btn) return;
            elements.pipPositionGrid.querySelectorAll('.pos-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.blendConfig.position = btn.dataset.pos;
            renderWorkspace();
            triggerProcess();
        });

        // Fade Sliders & Select
        elements.fadeRatioSlider.addEventListener('input', (e) => {
            state.blendConfig.fade_ratio = parseInt(e.target.value);
            elements.fadeRatioBadge.textContent = state.blendConfig.fade_ratio + '%';
            renderWorkspace();
            triggerProcess();
        });

        elements.selectBlendMode.addEventListener('change', (e) => {
            state.blendConfig.blend_mode = e.target.value;
            renderWorkspace();
            triggerProcess();
        });

        // Join Direction & Gap Sliders
        elements.btnJoinHorizontal.addEventListener('click', () => {
            state.blendConfig.direction = 'horizontal';
            elements.btnJoinHorizontal.classList.add('active');
            elements.btnJoinVertical.classList.remove('active');
            renderWorkspace();
            triggerProcess();
        });

        elements.btnJoinVertical.addEventListener('click', () => {
            state.blendConfig.direction = 'vertical';
            elements.btnJoinVertical.classList.add('active');
            elements.btnJoinHorizontal.classList.remove('active');
            renderWorkspace();
            triggerProcess();
        });

        elements.joinGapSlider.addEventListener('input', (e) => {
            state.blendConfig.gap = parseInt(e.target.value);
            elements.joinGapBadge.textContent = state.blendConfig.gap + 'px';
            renderWorkspace();
            triggerProcess();
        });
    }

    function loadSecondaryFile(file) {
        state.secondaryFileName = file.name;
        elements.secFileName.textContent = file.name;
        elements.secInfo.classList.remove('hidden');
        elements.btnUploadSecondary.classList.add('hidden');

        const reader = new FileReader();
        reader.onload = (event) => {
            state.secondaryImgSrc = event.target.result;
            const img = new Image();
            img.onload = () => {
                state.secondaryImg = img;
                renderWorkspace();
                triggerProcess();
            };
            img.src = state.secondaryImgSrc;
        };
        reader.readAsDataURL(file);
    }

    // ==========================================
    // PROCESSING ENGINE & SERVER API
    // ==========================================

    let processTimeout = null;
    let currentAbortController = null;

    function triggerProcess() {
        if (!state.img) return;

        clearTimeout(processTimeout);
        processTimeout = setTimeout(executeProcessingPipeline, 140);
    }

    function executeProcessingPipeline() {
        if (currentAbortController) {
            currentAbortController.abort();
        }
        currentAbortController = new AbortController();

        const payload = {
            image_data: getCombinedImageData(),
            crop_box: [state.cropBox.x, state.cropBox.y, state.cropBox.x + state.cropBox.w, state.cropBox.y + state.cropBox.h],
            rotate_angle: state.rotateAngle,
            flip_h: state.flipH,
            flip_v: state.flipV,
            scale_percent: state.scalePercent,
            exact_w: state.exactW,
            exact_h: state.exactH,
            format: state.format,
            quality: state.quality,
            target_kb: state.mode === 'target' ? state.targetKB : null,
            keep_exif: state.keepEXIF,
            brightness: state.brightness,
            contrast: state.contrast,
            saturation: state.saturation,
            sharpness: state.sharpness,
            blur: state.blur,
            temperature: state.temperature,
            vignette: state.vignette,
            filter_type: state.filterType,
            secondary_image_data: state.secondaryImgSrc,
            blend_config: state.secondaryImgSrc ? state.blendConfig : null
        };

        fetch('/api/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: currentAbortController.signal
        })
        .then(res => res.json())
        .then(data => {
            currentAbortController = null;
            if (data.error) {
                console.error(data.error);
                return;
            }

            state.procB64 = data.image_data;
            state.procWidth = data.processed_width;
            state.procHeight = data.processed_height;
            state.procSizeBytes = data.processed_size_bytes;

            updateMetricsUI(data);

            // ── Draw the processed result onto mainCanvas ──────────────────────
            // This ensures scale, quality, filters, and all adjustments are
            // visible on the main editing viewport, not just in split view.
            const procImg = new Image();
            procImg.onload = () => {
                // Keep the canvas at the original loaded image's display dimensions.
                // Draw the processed (possibly resized) image stretched to fill that
                // space with nearest-neighbor (pixelated) interpolation — this matches
                // what the split view shows and lets the user see quality/scale effects.
                const dw = state.origWidth;
                const dh = state.origHeight;
                elements.mainCanvas.width = dw;
                elements.mainCanvas.height = dh;
                ctx.clearRect(0, 0, dw, dh);
                ctx.imageSmoothingEnabled = false;   // nearest-neighbor → pixelation visible
                ctx.drawImage(procImg, 0, 0, dw, dh);
                ctx.imageSmoothingEnabled = true;    // restore for other drawing operations
                // Clear any leftover CSS filter — the server has already baked
                // brightness/contrast/saturation/blur into the returned pixels.
                elements.mainCanvas.style.filter = 'none';
            };
            procImg.src = state.procB64;
            // ──────────────────────────────────────────────────────────────────

            if (state.isComparing) {
                setupComparison();
            }
        })
        .catch(err => {
            if (err.name === 'AbortError') return;
            console.error("Processing error:", err);
        });
    }

    function updateMetricsUI(data) {
        elements.metricOrigSize.textContent = formatBytes(state.origSizeBytes);
        elements.metricOrigDim.textContent = `${state.origWidth} x ${state.origHeight} px`;

        elements.metricProcSize.textContent = formatBytes(data.processed_size_bytes);
        elements.metricProcDim.textContent = `${data.processed_width} x ${data.processed_height} px`;

        const savings = data.savings_percent;
        elements.savingsPercent.textContent = (savings >= 0 ? '-' : '+') + Math.abs(savings) + '%';
        elements.savingsSubtext.textContent = savings >= 0 ? "Saved file space" : "Increased file size";
        
        elements.savingsPercent.style.color = savings >= 0 ? "var(--accent-emerald)" : "var(--accent-coral)";

        if (state.mode === 'target') {
            elements.metricQuality.textContent = `Q:${data.quality}% (Scale:${data.scale}%)`;
        } else {
            elements.metricQuality.textContent = `${state.quality}%`;
        }
    }

    // ==========================================
    // SIDE-BY-SIDE COMPARISON SLIDER (Clip-Path Split)
    // ==========================================

    function setComparisonSplit(percent) {
        percent = Math.max(0, Math.min(100, percent));
        if (elements.imgAfter) {
            elements.imgAfter.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
        }
        if (elements.comparisonSliderBar) {
            elements.comparisonSliderBar.style.left = percent + '%';
        }
    }

    function setupComparison() {
        if (!state.img || !state.imgSrc) return;

        // Render clean original uncompressed image matching crop/rotate geometry for Before side
        if (state.cropBox) {
            const bw = Math.max(1, state.cropBox.w);
            const bh = Math.max(1, state.cropBox.h);
            const beforeCanvas = document.createElement('canvas');
            beforeCanvas.width = bw;
            beforeCanvas.height = bh;
            const bctx = beforeCanvas.getContext('2d');

            bctx.save();
            bctx.translate(bw / 2, bh / 2);
            bctx.rotate((state.rotateAngle * Math.PI) / 180);
            bctx.scale(state.flipH ? -1 : 1, state.flipV ? -1 : 1);
            bctx.drawImage(
                state.img,
                state.cropBox.x, state.cropBox.y, bw, bh,
                -bw / 2, -bh / 2, bw, bh
            );
            bctx.restore();
            elements.imgBefore.src = beforeCanvas.toDataURL('image/png');
        } else {
            elements.imgBefore.src = state.imgSrc;
        }

        elements.imgAfter.src = state.procB64 ? state.procB64 : state.imgSrc;
        
        // Ensure Before side is clean original (unfiltered) and After side receives all live edits
        elements.imgBefore.style.filter = 'none';
        updateLiveCanvasFilter();

        if (!state.procB64) {
            triggerProcess();
        }

        setComparisonSplit(50);
    }

    function initComparisonSliderEvents() {
        let isSliding = false;
        const container = elements.comparisonContainer;

        function updateSliderPos(clientX) {
            if (!container) return;
            const rect = container.getBoundingClientRect();
            if (rect.width <= 0) return;

            let offsetX = clientX - rect.left;
            const pct = (offsetX / rect.width) * 100;
            setComparisonSplit(pct);
        }

        container.addEventListener('mousedown', (e) => {
            isSliding = true;
            updateSliderPos(e.clientX);
            e.preventDefault();
        });

        window.addEventListener('mousemove', (e) => {
            if (!isSliding) return;
            updateSliderPos(e.clientX);
        });

        window.addEventListener('mouseup', () => {
            isSliding = false;
        });

        // Touch Support
        container.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                isSliding = true;
                updateSliderPos(e.touches[0].clientX);
            }
        });

        window.addEventListener('touchmove', (e) => {
            if (isSliding && e.touches.length > 0) {
                updateSliderPos(e.touches[0].clientX);
            }
        });

        window.addEventListener('touchend', () => {
            isSliding = false;
        });
    }

    // ==========================================
    // SAVE & BATCH OPERATIONS
    // ==========================================

    function saveOutputImage() {
        if (!state.img) {
            alert("Please load an image first.");
            return;
        }

        if (!state.procB64) {
            executeProcessingPipeline();
            setTimeout(saveOutputImage, 350);
            return;
        }

        const ext = state.format.toLowerCase();
        const defaultFilename = `${state.fileName}_optimized.${ext}`;

        if (window.pywebview && window.pywebview.api) {
            window.pywebview.api.save_file(state.procB64, defaultFilename).then(res => {
                if (res && res.success) {
                    alert("Image saved successfully to " + res.path);
                }
            });
        } else {
            try {
                // Convert Base64 data URL to binary Blob to bypass browser data URL download size limits
                const parts = state.procB64.split(',');
                const mimeMatch = parts[0].match(/:(.*?);/);
                const mime = mimeMatch ? mimeMatch[1] : 'image/' + ext;
                const bstr = atob(parts[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                const blob = new Blob([u8arr], { type: mime });
                const blobUrl = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = defaultFilename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
            } catch (err) {
                console.error("Save error:", err);
                const link = document.createElement('a');
                link.href = state.procB64;
                link.download = defaultFilename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    }

    function copyToClipboard() {
        if (!state.img) {
            alert('Please load an image first.');
            return;
        }

        if (!state.procB64) {
            executeProcessingPipeline();
            setTimeout(copyToClipboard, 350);
            return;
        }

        const btn = elements.btnCopyToClipboard;
        const originalHTML = btn.innerHTML;
        btn.disabled = true;

        try {
            // Convert base64 data URL to a PNG blob for the clipboard
            const parts = state.procB64.split(',');
            const bstr = atob(parts[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }

            // Clipboard API requires image/png
            const pngBlob = new Blob([u8arr], { type: 'image/png' });

            // If the processed format isn't PNG, re-encode to PNG via an offscreen canvas
            const needsReencode = state.format.toUpperCase() !== 'PNG';

            const writeToClipboard = (blob) => {
                navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]).then(() => {
                    btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                    btn.classList.remove('btn-secondary');
                    btn.classList.add('btn-success');
                    setTimeout(() => {
                        btn.innerHTML = originalHTML;
                        btn.classList.remove('btn-success');
                        btn.classList.add('btn-secondary');
                        btn.disabled = false;
                    }, 2000);
                }).catch(err => {
                    console.error('Clipboard write failed:', err);
                    alert('Failed to copy image. Your browser may not support clipboard image writing.');
                    btn.innerHTML = originalHTML;
                    btn.disabled = false;
                });
            };

            if (needsReencode) {
                // Re-encode to PNG via a temporary canvas
                const tmpImg = new Image();
                tmpImg.onload = () => {
                    const tmpCanvas = document.createElement('canvas');
                    tmpCanvas.width = tmpImg.width;
                    tmpCanvas.height = tmpImg.height;
                    const tmpCtx = tmpCanvas.getContext('2d');
                    tmpCtx.drawImage(tmpImg, 0, 0);
                    tmpCanvas.toBlob((blob) => {
                        writeToClipboard(blob);
                    }, 'image/png');
                };
                tmpImg.src = state.procB64;
            } else {
                writeToClipboard(pngBlob);
            }
        } catch (err) {
            console.error('Copy to clipboard error:', err);
            alert('Failed to copy image to clipboard.');
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }
    }

    function addToBatch() {
        if (!state.imgSrc) return;

        state.batchQueue.push({
            id: Date.now(),
            name: state.fileName,
            src: state.imgSrc,
            format: state.format,
            quality: state.quality,
            targetKB: state.targetKB
        });

        updateBatchDrawerUI();
        elements.batchDrawer.classList.remove('collapsed');
    }

    function handleBatchFiles(files) {
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                state.batchQueue.push({
                    id: Date.now() + Math.random(),
                    name: file.name.replace(/\.[^/.]+$/, ""),
                    src: e.target.result,
                    format: state.format,
                    quality: state.quality,
                    targetKB: state.targetKB
                });
                updateBatchDrawerUI();
            };
            reader.readAsDataURL(file);
        });
        elements.batchDrawer.classList.remove('collapsed');
    }

    function updateBatchDrawerUI() {
        elements.batchCountBadge.textContent = state.batchQueue.length + " files";
        elements.btnProcessBatch.disabled = state.batchQueue.length === 0;

        if (state.batchQueue.length === 0) {
            elements.batchItemsContainer.innerHTML = '<div class="empty-batch-state"><p>No files in batch queue. Drag multiple files or add single images to process together.</p></div>';
            return;
        }

        elements.batchItemsContainer.innerHTML = state.batchQueue.map(item => `
            <div class="batch-item-card" style="display:flex; align-items:center; gap:10px; background:var(--bg-input); padding:8px 12px; border-radius:8px; border:1px solid var(--border-color);">
                <img src="${item.src}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;">
                <div style="font-size:0.75rem;">
                    <div style="font-weight:600; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; max-width:120px;">${item.name}</div>
                    <div style="color:var(--text-muted);">${item.format} | ${item.quality}%</div>
                </div>
            </div>
        `).join('');
    }

    function clearBatch() {
        state.batchQueue = [];
        updateBatchDrawerUI();
    }

    function processBatchZIP() {
        if (state.batchQueue.length === 0) return;

        elements.processingLoader.classList.remove('hidden');
        elements.loaderText.textContent = "Processing batch queue with parallel CPU threads...";
        elements.btnProcessBatch.disabled = true;

        const payload = {
            items: state.batchQueue.map(item => ({
                name: item.name,
                src: item.src
            })),
            settings: {
                format: state.format,
                quality: state.quality,
                target_kb: state.mode === 'target' ? state.targetKB : null,
                scale_percent: state.scalePercent
            }
        };

        fetch('/api/batch_process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(res => {
            if (!res.ok) {
                return res.json().then(err => { throw new Error(err.error || "Batch process failed"); });
            }
            return res.blob();
        })
        .then(blob => {
            elements.processingLoader.classList.add('hidden');
            elements.btnProcessBatch.disabled = false;
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `Batch_Optimized_Images.zip`;
            link.click();
        })
        .catch(err => {
            elements.processingLoader.classList.add('hidden');
            elements.btnProcessBatch.disabled = false;
            console.error("Batch processing error:", err);
            alert("Batch processing failed: " + err.message);
        });
    }

    // Helper Utility
    function formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // ==========================================
    // UI THEME & GLASS CUSTOMIZER ENGINE
    // ==========================================

    const themeConfig = {
        preset: 'cosmic',
        accentColor: '#00f2fe',
        blur: 20,
        opacity: 45,
        radius: 14
    };

    function loadSavedTheme() {
        const saved = localStorage.getItem('pixelcompress_glass_theme');
        if (saved) {
            try {
                Object.assign(themeConfig, JSON.parse(saved));
            } catch (e) {
                console.error("Error loading saved theme:", e);
            }
        }
        applyThemeToDOM();
    }

    function saveThemeConfig() {
        localStorage.setItem('pixelcompress_glass_theme', JSON.stringify(themeConfig));
    }

    function applyThemeToDOM() {
        const root = document.documentElement;
        root.style.setProperty('--glass-blur', themeConfig.blur + 'px');
        root.style.setProperty('--glass-opacity', (themeConfig.opacity / 100).toString());
        root.style.setProperty('--glass-radius', themeConfig.radius + 'px');
        root.style.setProperty('--accent-cyan', themeConfig.accentColor);
        
        const hex = themeConfig.accentColor.replace('#', '');
        if (hex.length === 6) {
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            root.style.setProperty('--accent-glow', `rgba(${r}, ${g}, ${b}, 0.35)`);
        }

        if (themeConfig.preset === 'obsidian') {
            root.style.setProperty('--bg-dark', '#040407');
            root.style.setProperty('--bg-mesh', 'radial-gradient(at 0% 0%, rgba(168, 85, 247, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(236, 72, 153, 0.12) 0px, transparent 50%), #040407');
        } else if (themeConfig.preset === 'emerald') {
            root.style.setProperty('--bg-dark', '#04120c');
            root.style.setProperty('--bg-mesh', 'radial-gradient(at 0% 0%, rgba(0, 230, 118, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(0, 242, 254, 0.1) 0px, transparent 50%), #04120c');
        } else if (themeConfig.preset === 'diamond') {
            root.style.setProperty('--bg-dark', '#0f172a');
            root.style.setProperty('--bg-mesh', 'radial-gradient(at 0% 0%, rgba(56, 189, 248, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(99, 102, 241, 0.12) 0px, transparent 50%), #0f172a');
        } else {
            root.style.setProperty('--bg-dark', '#090c15');
            root.style.setProperty('--bg-mesh', 'radial-gradient(at 0% 0%, rgba(0, 242, 254, 0.12) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(168, 85, 247, 0.1) 0px, transparent 50%), #090c15');
        }

        if (elements.themeBlurSlider) {
            elements.themeBlurSlider.value = themeConfig.blur;
            elements.blurValueBadgeUI.textContent = themeConfig.blur + 'px';
            elements.themeOpacitySlider.value = themeConfig.opacity;
            elements.opacityValueBadgeUI.textContent = themeConfig.opacity + '%';
            elements.themeRadiusSlider.value = themeConfig.radius;
            elements.radiusValueBadgeUI.textContent = themeConfig.radius + 'px';
            elements.themeCustomColorPicker.value = themeConfig.accentColor;

            elements.themePresetsGrid.querySelectorAll('.theme-card').forEach(card => {
                card.classList.toggle('active', card.dataset.preset === themeConfig.preset);
            });
            elements.accentSwatchesGrid.querySelectorAll('.accent-swatch').forEach(swatch => {
                swatch.classList.toggle('active', swatch.dataset.color.toLowerCase() === themeConfig.accentColor.toLowerCase());
            });
        }

        saveThemeConfig();
    }

    function initThemeCustomizerEvents() {
        if (!elements.btnThemeCustomizer) return;

        elements.btnThemeCustomizer.addEventListener('click', () => {
            elements.themeModalBackdrop.classList.remove('hidden');
        });
        elements.btnCloseThemeModal.addEventListener('click', () => {
            elements.themeModalBackdrop.classList.add('hidden');
        });
        elements.btnApplyTheme.addEventListener('click', () => {
            elements.themeModalBackdrop.classList.add('hidden');
        });

        elements.themePresetsGrid.addEventListener('click', (e) => {
            const card = e.target.closest('.theme-card');
            if (!card) return;
            themeConfig.preset = card.dataset.preset;

            if (themeConfig.preset === 'obsidian') themeConfig.accentColor = '#a855f7';
            else if (themeConfig.preset === 'emerald') themeConfig.accentColor = '#00e676';
            else if (themeConfig.preset === 'diamond') themeConfig.accentColor = '#38bdf8';
            else themeConfig.accentColor = '#00f2fe';

            applyThemeToDOM();
        });

        elements.accentSwatchesGrid.addEventListener('click', (e) => {
            const swatch = e.target.closest('.accent-swatch');
            if (!swatch) return;
            themeConfig.accentColor = swatch.dataset.color;
            applyThemeToDOM();
        });

        elements.themeCustomColorPicker.addEventListener('input', (e) => {
            themeConfig.accentColor = e.target.value;
            applyThemeToDOM();
        });

        elements.themeBlurSlider.addEventListener('input', (e) => {
            themeConfig.blur = parseInt(e.target.value);
            applyThemeToDOM();
        });

        elements.themeOpacitySlider.addEventListener('input', (e) => {
            themeConfig.opacity = parseInt(e.target.value);
            applyThemeToDOM();
        });

        elements.themeRadiusSlider.addEventListener('input', (e) => {
            themeConfig.radius = parseInt(e.target.value);
            applyThemeToDOM();
        });

        elements.btnResetThemeDefaults.addEventListener('click', () => {
            themeConfig.preset = 'cosmic';
            themeConfig.accentColor = '#00f2fe';
            themeConfig.blur = 20;
            themeConfig.opacity = 45;
            themeConfig.radius = 14;
            applyThemeToDOM();
        });
    }

    // ==========================================
    // PRESET PROFILES ENGINE
    // ==========================================

    let _loadedPresets = [];

    function loadPresets() {
        fetch('/api/presets')
            .then(r => r.json())
            .then(presets => {
                _loadedPresets = presets;
                renderPresetsGrid(presets);
            })
            .catch(() => {
                const grid = document.getElementById('presetsGrid');
                if (grid) grid.innerHTML = '<span style="font-size:0.75rem;color:var(--text-muted);">Could not load presets.</span>';
            });
    }

    function renderPresetsGrid(presets) {
        const grid = document.getElementById('presetsGrid');
        if (!grid) return;
        grid.innerHTML = presets.map(p => `
            <button class="quick-preset-chip ${!p.builtin ? 'custom-chip' : ''}"
                    data-preset-id="${p.id}"
                    title="${p.name}">
                <i class="fa-solid ${p.icon || 'fa-star'}"></i>
                ${p.name}
            </button>
        `).join('');

        grid.querySelectorAll('.quick-preset-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                const pid = btn.dataset.presetId;
                const preset = _loadedPresets.find(p => p.id === pid);
                if (preset) applyPreset(preset, btn);
            });
        });
    }

    function applyPreset(preset, activeBtn) {
        const s = preset.settings;

        // — Format —
        if (s.format) {
            state.format = s.format;
            const sel = document.getElementById('selectFormat');
            if (sel) sel.value = s.format;
        }

        // — Quality —
        if (s.quality !== undefined) {
            state.quality = s.quality;
            const qs = document.getElementById('qualitySlider');
            const qb = document.getElementById('qualityValueBadge');
            if (qs) qs.value = s.quality;
            if (qb) qb.textContent = s.quality + '%';
        }

        // — Adjustments —
        const sliderMap = {
            brightness: ['brightnessSlider', 'brightnessValueBadge', '%'],
            contrast:   ['contrastSlider',   'contrastValueBadge',   '%'],
            saturation: ['saturationSlider',  'saturationValueBadge', '%'],
            sharpness:  ['sharpnessSlider',   'sharpnessValueBadge',  '%'],
            blur:       ['blurSlider',        'blurValueBadge',       'px'],
            temperature:['temperatureSlider', 'temperatureValueBadge','°'],
            vignette:   ['vignetteSlider',    'vignetteValueBadge',   '%'],
        };
        Object.entries(sliderMap).forEach(([key, [sliderId, badgeId]]) => {
            if (s[key] !== undefined) {
                state[key] = s[key];
                const sl = document.getElementById(sliderId);
                const ba = document.getElementById(badgeId);
                if (sl) sl.value = s[key];
                if (ba) ba.value !== undefined ? (ba.value = s[key]) : (ba.textContent = s[key]);
            }
        });

        // — Filter —
        if (s.filterType) {
            state.filterType = s.filterType;
            document.querySelectorAll('#filterPresets .preset-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.filter === s.filterType);
            });
        }

        // Highlight active chip
        document.querySelectorAll('.quick-preset-chip').forEach(b => b.classList.remove('active'));
        if (activeBtn) activeBtn.classList.add('active');

        renderWorkspace();
        triggerProcess();

        showPresetToast(`✅ Preset "${preset.name}" applied`);
    }

    function saveCurrentAsPreset() {
        const name = prompt('Name for this preset:', '');
        if (!name || !name.trim()) return;

        const settings = {
            format:      state.format,
            quality:     state.quality,
            scalePercent:state.scalePercent,
            brightness:  state.brightness,
            contrast:    state.contrast,
            saturation:  state.saturation,
            sharpness:   state.sharpness,
            blur:        state.blur,
            temperature: state.temperature,
            vignette:    state.vignette,
            filterType:  state.filterType,
        };

        fetch('/api/presets/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name.trim(), settings })
        })
        .then(r => r.json())
        .then(data => {
            if (data.error) { alert('Error: ' + data.error); return; }
            loadPresets();
            showPresetToast(`⭐ Preset "${name.trim()}" saved!`);
        })
        .catch(() => alert('Could not save preset.'));
    }

    function showPresetToast(msg) {
        let toast = document.getElementById('presetToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'presetToast';
            toast.style.cssText = `
                position:fixed; bottom:90px; left:50%; transform:translateX(-50%);
                background:var(--glass-bg); backdrop-filter:blur(16px);
                border:1px solid var(--border-color); border-radius:24px;
                padding:8px 18px; color:var(--text-primary); font-size:0.85rem;
                z-index:9999; pointer-events:none; opacity:0;
                transition:opacity 0.3s; white-space:nowrap;
                box-shadow:0 4px 20px rgba(0,0,0,0.4);
            `;
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.style.opacity = '1';
        clearTimeout(toast._t);
        toast._t = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
    }

    // Wire up Save Preset button
    const btnSavePreset = document.getElementById('btnSavePreset');
    if (btnSavePreset) btnSavePreset.addEventListener('click', saveCurrentAsPreset);

    // Load presets on startup
    loadPresets();

    // Start App
    initEvents();
});