import React from 'react';
import ScheduleStepComponent from './ScheduleStepComponent';
import PriceCategoryStepComponent from './PriceCategoryStepComponent';
import CapacityStepComponent from './CapacityStepComponent';
import PricingStepComponent from './PricingStepComponent';

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

interface PricingLevel {
  id: string;
  minPeople: number;
  maxPeople: number;
  clientPays: string;
  pricePerPerson: string;
}

interface AgeGroup {
  id: string;
  name: string;
  minAge: number;
  maxAge: number;
}

interface CapacityData {
  groupMinSize: number;
  groupMaxSize: number | null;
  maxParticipants: number;
}

interface StepManagerProps {
  currentStep: number;
  formData: ScheduleData;
  pricingType: 'same' | 'ageBased';
  pricingLevels: PricingLevel[];
  ageGroups: AgeGroup[];
  capacityData: CapacityData;
  onFormDataChange: (data: ScheduleData) => void;
  onPricingTypeChange: (type: 'same' | 'ageBased') => void;
  onPricingLevelsChange: (levels: PricingLevel[]) => void;
  onAgeGroupsChange: (groups: AgeGroup[]) => void;
  onCapacityDataChange: (data: CapacityData) => void;
  onAddPricingLevel: () => void;
  onRemovePricingLevel: (id: string) => void;
  onPricingLevelChange: (id: string, field: keyof PricingLevel, value: string | number) => void;
  onAddAgeGroup: () => void;
  onRemoveAgeGroup: (id: string) => void;
  onManualAgeRangeChange: (id: string, field: 'minAge' | 'maxAge', value: number) => void;
  onContinue: () => void;
  onBack: () => void;
  language: string;
  getTranslation: (key: string, lang: string) => string;
  isLoading: boolean;
  isSaving: boolean;
}

export default function StepManager({
  currentStep,
  formData,
  pricingType,
  pricingLevels,
  ageGroups,
  capacityData,
  onFormDataChange,
  onPricingTypeChange,
  onPricingLevelsChange,
  onAgeGroupsChange,
  onCapacityDataChange,
  onAddPricingLevel,
  onRemovePricingLevel,
  onPricingLevelChange,
  onAddAgeGroup,
  onRemoveAgeGroup,
  onManualAgeRangeChange,
  onContinue,
  onBack,
  language,
  getTranslation,
  isLoading,
  isSaving
}: StepManagerProps) {
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ScheduleStepComponent
            formData={formData}
            onFormDataChange={onFormDataChange}
            onContinue={onContinue}
            onBack={onBack}
            language={language}
            getTranslation={getTranslation}
            isLoading={isLoading}
            isSaving={isSaving}
          />
        );
      
      case 2:
        return (
          <PriceCategoryStepComponent
            pricingType={pricingType}
            onPricingTypeChange={onPricingTypeChange}
            onContinue={onContinue}
            onBack={onBack}
            language={language}
            getTranslation={getTranslation}
            isLoading={isLoading}
            isSaving={isSaving}
          />
        );
      
      case 3:
        return (
          <CapacityStepComponent
            capacityData={capacityData}
            onCapacityDataChange={onCapacityDataChange}
            onContinue={onContinue}
            onBack={onBack}
            language={language}
            getTranslation={getTranslation}
            isLoading={isLoading}
            isSaving={isSaving}
          />
        );
      
      case 4:
        return (
          <PricingStepComponent
            pricingType={pricingType}
            pricingLevels={pricingLevels}
            ageGroups={ageGroups}
            onPricingLevelsChange={onPricingLevelsChange}
            onAgeGroupsChange={onAgeGroupsChange}
            onAddPricingLevel={onAddPricingLevel}
            onRemovePricingLevel={onRemovePricingLevel}
            onPricingLevelChange={onPricingLevelChange}
            onAddAgeGroup={onAddAgeGroup}
            onRemoveAgeGroup={onRemoveAgeGroup}
            onManualAgeRangeChange={onManualAgeRangeChange}
            onContinue={onContinue}
            onBack={onBack}
            language={language}
            getTranslation={getTranslation}
            isLoading={isLoading}
            isSaving={isSaving}
          />
        );
      
      default:
        return (
          <div className="alert alert-danger">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {getTranslation('stepSchedule.error.invalidStep', language)}
          </div>
        );
    }
  };

  return (
    <div>
      {/* Indicador de progreso */}
      <div className="mb-4">
        <div className="progress" style={{ height: '8px' }}>
          <div 
            className="progress-bar bg-primary" 
            role="progressbar" 
            style={{ width: `${(currentStep / 4) * 100}%` }}
            aria-valuenow={currentStep} 
            aria-valuemin={1} 
            aria-valuemax={4}
          ></div>
        </div>
        <div className="d-flex justify-content-between mt-2">
          <small className="text-muted">
            {getTranslation('stepSchedule.progress.step', language)} {currentStep} {getTranslation('stepSchedule.progress.of', language)} 4
          </small>
          <small className="text-muted">
            {Math.round((currentStep / 4) * 100)}%
          </small>
        </div>
      </div>

      {/* Título del paso actual */}
      <div className="mb-4">
        <h3 className="text-primary">
          {currentStep === 1 && getTranslation('stepSchedule.steps.schedule.title', language)}
          {currentStep === 2 && getTranslation('stepSchedule.steps.priceCategory.title', language)}
          {currentStep === 3 && getTranslation('stepSchedule.steps.capacity.title', language)}
          {currentStep === 4 && getTranslation('stepSchedule.steps.pricing.title', language)}
        </h3>
        <p className="text-muted">
          {currentStep === 1 && getTranslation('stepSchedule.steps.schedule.description', language)}
          {currentStep === 2 && getTranslation('stepSchedule.steps.priceCategory.description', language)}
          {currentStep === 3 && getTranslation('stepSchedule.steps.capacity.description', language)}
          {currentStep === 4 && getTranslation('stepSchedule.steps.pricing.description', language)}
        </p>
      </div>

      {/* Contenido del paso */}
      {renderStep()}
    </div>
  );
}

