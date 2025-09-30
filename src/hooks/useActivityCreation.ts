import { useAppSelector, useAppDispatch } from '../redux/store';
import { 
  setActivityId, 
  setSelectedCategory, 
  setCurrentStep, 
  resetActivityCreation, 
  clearActivityCreation 
} from '../redux/activityCreationSlice';

export const useActivityCreation = () => {
  const dispatch = useAppDispatch();
  const { activityId, selectedCategory, currentStep, totalSteps } = useAppSelector(state => state.activityCreation);

  const updateActivityId = (id: string) => {
    dispatch(setActivityId(id));
  };

  const updateSelectedCategory = (category: { id: number; name: string }) => {
    dispatch(setSelectedCategory(category));
  };

  const updateCurrentStep = (step: number) => {
    dispatch(setCurrentStep(step));
  };

  const reset = () => {
    dispatch(resetActivityCreation());
  };

  const clear = () => {
    dispatch(clearActivityCreation());
  };

  return {
    // Estado
    activityId,
    selectedCategory,
    currentStep,
    totalSteps,
    
    // Acciones
    updateActivityId,
    updateSelectedCategory,
    updateCurrentStep,
    reset,
    clear
  };
}; 