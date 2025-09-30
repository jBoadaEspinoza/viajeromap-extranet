import React from 'react';

interface ScheduleData {
  scheduleName: string;
  startDate: string;
  hasEndDate: boolean;
  endDate: string;
  weeklySchedule: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  timeSlots: {
    [key: string]: Array<{
      id: string;
      hour: string;
      minute: string;
    }>;
  };
  exceptions: Array<{
    date: string;
    description: string;
  }>;
}

interface ScheduleStepComponentProps {
  formData: ScheduleData;
  onFormDataChange: (data: ScheduleData) => void;
  onContinue: () => void;
  onBack: () => void;
  language: string;
  getTranslation: (key: string, lang: string) => string;
  isLoading: boolean;
  isSaving: boolean;
}

export default function ScheduleStepComponent({
  formData,
  onFormDataChange,
  onContinue,
  onBack,
  language,
  getTranslation,
  isLoading,
  isSaving
}: ScheduleStepComponentProps) {
  const handleInputChange = (field: keyof ScheduleData, value: any) => {
    onFormDataChange({
      ...formData,
      [field]: value
    });
  };

  const handleWeeklyScheduleChange = (day: keyof ScheduleData['weeklySchedule'], checked: boolean) => {
    onFormDataChange({
      ...formData,
      weeklySchedule: {
        ...formData.weeklySchedule,
        [day]: checked
      }
    });
  };

  const handleAddException = () => {
    onFormDataChange({
      ...formData,
      exceptions: [...formData.exceptions, { date: '', description: '' }]
    });
  };

  const handleRemoveException = (index: number) => {
    onFormDataChange({
      ...formData,
      exceptions: formData.exceptions.filter((_, i) => i !== index)
    });
  };

  const handleExceptionChange = (index: number, field: 'date' | 'description', value: string) => {
    onFormDataChange({
      ...formData,
      exceptions: formData.exceptions.map((exception, i) => 
        i === index ? { ...exception, [field]: value } : exception
      )
    });
  };

  const handleAddTimeSlot = (day: string) => {
    const newTimeSlot = {
      id: Date.now().toString(),
      hour: '08',
      minute: '00'
    };
    
    onFormDataChange({
      ...formData,
      timeSlots: {
        ...formData.timeSlots,
        [day]: [...(formData.timeSlots[day] || []), newTimeSlot]
      }
    });
  };

  const handleRemoveTimeSlot = (day: string, timeSlotId: string) => {
    onFormDataChange({
      ...formData,
      timeSlots: {
        ...formData.timeSlots,
        [day]: (formData.timeSlots[day] || []).filter(slot => slot.id !== timeSlotId)
      }
    });
  };

  const handleTimeSlotChange = (day: string, timeSlotId: string, field: 'hour' | 'minute', value: string) => {
    onFormDataChange({
      ...formData,
      timeSlots: {
        ...formData.timeSlots,
        [day]: (formData.timeSlots[day] || []).map(slot => 
          slot.id === timeSlotId ? { ...slot, [field]: value } : slot
        )
      }
    });
  };

  const days = [
    { key: 'monday', label: getTranslation('stepSchedule.weeklySchedule.monday', language) },
    { key: 'tuesday', label: getTranslation('stepSchedule.weeklySchedule.tuesday', language) },
    { key: 'wednesday', label: getTranslation('stepSchedule.weeklySchedule.wednesday', language) },
    { key: 'thursday', label: getTranslation('stepSchedule.weeklySchedule.thursday', language) },
    { key: 'friday', label: getTranslation('stepSchedule.weeklySchedule.friday', language) },
    { key: 'saturday', label: getTranslation('stepSchedule.weeklySchedule.saturday', language) },
    { key: 'sunday', label: getTranslation('stepSchedule.weeklySchedule.sunday', language) }
  ];

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">
                <i className="fas fa-calendar-alt me-2"></i>
                {getTranslation('stepSchedule.title', language)}
              </h4>
            </div>
            <div className="card-body">
              {/* Nombre del horario */}
              <div className="mb-4">
                <label htmlFor="scheduleName" className="form-label fw-semibold">
                  {getTranslation('stepSchedule.scheduleName', language)}
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="scheduleName"
                  value={formData.scheduleName}
                  onChange={(e) => handleInputChange('scheduleName', e.target.value)}
                  placeholder={getTranslation('stepSchedule.scheduleNamePlaceholder', language)}
                />
              </div>

              {/* Fechas */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <label htmlFor="startDate" className="form-label fw-semibold">
                    {getTranslation('stepSchedule.startDate', language)}
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    id="startDate"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <div className="form-check mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="hasEndDate"
                      checked={formData.hasEndDate}
                      onChange={(e) => handleInputChange('hasEndDate', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="hasEndDate">
                      {getTranslation('stepSchedule.hasEndDate', language)}
                    </label>
                  </div>
                  {formData.hasEndDate && (
                    <input
                      type="date"
                      className="form-control"
                      id="endDate"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                    />
                  )}
                </div>
              </div>

              {/* Horario semanal */}
              <div className="mb-4">
                <h5 className="mb-3">
                  <i className="fas fa-calendar-week me-2"></i>
                  {getTranslation('stepSchedule.weeklySchedule.title', language)}
                </h5>
                <div className="row">
                  {days.map(day => (
                    <div key={day.key} className="col-md-6 col-lg-4 mb-2">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={day.key}
                          checked={formData.weeklySchedule[day.key as keyof ScheduleData['weeklySchedule']]}
                          onChange={(e) => handleWeeklyScheduleChange(day.key as keyof ScheduleData['weeklySchedule'], e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor={day.key}>
                          {day.label}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Horarios por día */}
              <div className="mb-4">
                <h5 className="mb-3">
                  <i className="fas fa-clock me-2"></i>
                  {getTranslation('stepSchedule.timeSlots.title', language)}
                </h5>
                {days.map(day => {
                  const dayKey = day.key as keyof ScheduleData['weeklySchedule'];
                  if (!formData.weeklySchedule[dayKey]) return null;
                  
                  return (
                    <div key={day.key} className="mb-3">
                      <h6 className="text-primary">{day.label}</h6>
                      <div className="row g-2">
                        {formData.timeSlots[day.key]?.map(slot => (
                          <div key={slot.id} className="col-md-3">
                            <div className="input-group">
                              <input
                                type="number"
                                className="form-control"
                                min="0"
                                max="23"
                                value={slot.hour}
                                onChange={(e) => handleTimeSlotChange(day.key, slot.id, 'hour', e.target.value.padStart(2, '0'))}
                              />
                              <span className="input-group-text">:</span>
                              <input
                                type="number"
                                className="form-control"
                                min="0"
                                max="59"
                                step="15"
                                value={slot.minute}
                                onChange={(e) => handleTimeSlotChange(day.key, slot.id, 'minute', e.target.value.padStart(2, '0'))}
                              />
                              <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={() => handleRemoveTimeSlot(day.key, slot.id)}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                        <div className="col-md-3">
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => handleAddTimeSlot(day.key)}
                          >
                            <i className="fas fa-plus me-1"></i>
                            {getTranslation('stepSchedule.timeSlots.add', language)}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Excepciones */}
              <div className="mb-4">
                <h5 className="mb-3">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {getTranslation('stepSchedule.exceptions.title', language)}
                </h5>
                {formData.exceptions.map((exception, index) => (
                  <div key={index} className="row g-2 mb-2">
                    <div className="col-md-4">
                      <input
                        type="date"
                        className="form-control"
                        value={exception.date}
                        onChange={(e) => handleExceptionChange(index, 'date', e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        type="text"
                        className="form-control"
                        value={exception.description}
                        onChange={(e) => handleExceptionChange(index, 'description', e.target.value)}
                        placeholder={getTranslation('stepSchedule.exceptions.descriptionPlaceholder', language)}
                      />
                    </div>
                    <div className="col-md-2">
                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={() => handleRemoveException(index)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={handleAddException}
                >
                  <i className="fas fa-plus me-1"></i>
                  {getTranslation('stepSchedule.exceptions.add', language)}
                </button>
              </div>

              {/* Botones de navegación */}
              <div className="d-flex justify-content-between mt-4">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={onBack}
                  disabled={isLoading || isSaving}
                >
                  <i className="fas fa-arrow-left me-2"></i>
                  {getTranslation('stepSchedule.buttons.back', language)}
                </button>
                
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onContinue}
                  disabled={isLoading || isSaving || !formData.scheduleName || !formData.startDate}
                >
                  {isSaving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      {getTranslation('stepSchedule.buttons.saving', language)}
                    </>
                  ) : (
                    <>
                      {getTranslation('stepSchedule.buttons.continue', language)}
                      <i className="fas fa-arrow-right ms-2"></i>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

