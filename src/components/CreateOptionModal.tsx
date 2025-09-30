import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../utils/translations';

interface CreateOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateOption: (useTemplate: boolean, templateOption?: string) => void;
  existingOptions: Array<{ id: string; title: string }>;
  isCreating?: boolean;
}

const CreateOptionModal: React.FC<CreateOptionModalProps> = ({
  isOpen,
  onClose,
  onCreateOption,
  existingOptions,
  isCreating = false
}) => {
  const { language } = useLanguage();
  const [selectedOption, setSelectedOption] = useState<'new' | 'template'>('new');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  if (!isOpen) return null;

  const handleCreate = () => {
    if (selectedOption === 'template' && selectedTemplate) {
      onCreateOption(true, selectedTemplate);
    } else {
      onCreateOption(false);
    }
    onClose();
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold text-primary">
              {getTranslation('createOptionModal.title', language)}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>

          {/* Body */}
          <div className="modal-body pt-0">
            {/* Instrucciones */}
            <div className="mb-4">
              <p className="text-muted mb-2">
                {getTranslation('createOptionModal.instructions.help', language)}
              </p>
              <p className="text-muted mb-2">
                {getTranslation('createOptionModal.instructions.format', language)}
              </p>
              <p className="text-muted mb-0">
                {getTranslation('createOptionModal.instructions.edit', language)}
              </p>
            </div>

            {/* Opciones de radio button */}
            <div className="mb-4">
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="radio"
                  name="optionType"
                  id="newOption"
                  value="new"
                  checked={selectedOption === 'new'}
                  onChange={(e) => setSelectedOption(e.target.value as 'new' | 'template')}
                />
                <label className="form-check-label fw-medium" htmlFor="newOption">
                  {getTranslation('createOptionModal.radio.newOption', language)}
                </label>
              </div>

              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="optionType"
                  id="useTemplate"
                  value="template"
                  checked={selectedOption === 'template'}
                  onChange={(e) => setSelectedOption(e.target.value as 'new' | 'template')}
                />
                <label className="form-check-label fw-medium" htmlFor="useTemplate">
                  {getTranslation('createOptionModal.radio.useTemplate', language)}
                </label>
              </div>

              {/* Dropdown para seleccionar plantilla */}
              {selectedOption === 'template' && (
                <div className="mt-3 ms-4">
                  <select
                    className="form-select"
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    disabled={existingOptions.length === 0}
                  >
                    <option value="">
                      {existingOptions.length === 0 
                        ? getTranslation('createOptionModal.template.noOptions', language)
                        : getTranslation('createOptionModal.template.select', language)
                      }
                    </option>
                    {existingOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer border-0 pt-0">
            <button
              type="button"
              className="btn btn-link text-muted"
              onClick={onClose}
            >
              {getTranslation('createOptionModal.cancel', language)}
            </button>
            <button
              type="button"
              className="btn btn-primary rounded-pill px-4"
              onClick={handleCreate}
              disabled={(selectedOption === 'template' && !selectedTemplate) || isCreating}
            >
              {isCreating ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Creando...
                </>
              ) : (
                getTranslation('createOptionModal.create', language)
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOptionModal; 