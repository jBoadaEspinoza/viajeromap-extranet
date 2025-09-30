import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../utils/translations';

export interface ItineraryItem {
  id: string;
  type: 'start' | 'end' | 'activity' | 'route' | 'sub-activity';
  title: string;
  subtitle?: string;
  description?: string;
  duration?: string;
  icon?: string;
  color?: string;
  subItems?: ItineraryItem[];
}

export interface ItineraryData {
  title: string;
  start: ItineraryItem;
  end: ItineraryItem;
  items: ItineraryItem[];
}

interface ItineraryScheduleProps {
  className?: string;
  data?: ItineraryData;
  editable?: boolean;
  onItemRemove?: (itemId: string) => void;
  onSubItemRemove?: (itemId: string, subItemId: string) => void;
  onItemMoveUp?: (itemId: string) => void;
  onItemMoveDown?: (itemId: string) => void;
  onSubItemMoveUp?: (itemId: string, subItemId: string) => void;
  onSubItemMoveDown?: (itemId: string, subItemId: string) => void;
  onAddSegment?: (afterItemId: string) => void;
  onAddItem?: (item: ItineraryItem) => void;
  showTypeSelection?: boolean;
  selectedType?: 'activity' | 'transfer' | null;
  onTypeSelect?: (type: 'activity' | 'transfer') => void;
  onTypeSelectionBack?: () => void;
}

// Configuración de tipos de elementos
const ITEM_TYPE_CONFIG = {
  start: {
    icon: 'fas fa-home',
    color: 'bg-warning text-white',
    size: '40px',
    fontSize: '14px'
  },
  end: {
    icon: 'fas fa-home',
    color: 'bg-warning text-white',
    size: '40px',
    fontSize: '14px'
  },
  activity: {
    icon: 'fas fa-suitcase-rolling',
    color: 'bg-primary text-white',
    size: '40px',
    fontSize: '14px'
  },
  route: {
    icon: 'fas fa-route',
    color: 'bg-white border border-dark text-dark',
    size: '40px',
    fontSize: '14px'
  },
  'sub-activity': {
    icon: 'fas fa-star',
    color: 'bg-info text-white',
    size: '40px',
    fontSize: '14px'
  }
};

const SUB_ITEM_CONFIG = {
  activity: {
    icon: 'fas fa-star',
    color: 'bg-success text-white',
    size: '20px',
    fontSize: '8px'
  },
  route: {
    icon: 'fas fa-route',
    color: 'bg-info text-white',
    size: '20px',
    fontSize: '8px'
  }
};

const ItinerarySchedule: React.FC<ItineraryScheduleProps> = ({ 
  className = '', 
  data, 
  editable = false,
  onItemRemove,
  onSubItemRemove,
  onItemMoveUp,
  onItemMoveDown,
  onSubItemMoveUp,
  onSubItemMoveDown,
  onAddSegment,
  onAddItem,
  showTypeSelection = false,
  selectedType = null,
  onTypeSelect,
  onTypeSelectionBack
}) => {
  const { language } = useLanguage();
  const [localSelectedType, setLocalSelectedType] = useState<'activity' | 'transfer' | null>(selectedType);
  const [showAddSegmentFlow, setShowAddSegmentFlow] = useState(false);
  const [showActivityDefinition, setShowActivityDefinition] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showActivityDetails, setShowActivityDetails] = useState(false);

  // Determinar si debe mostrar la selección de tipo automáticamente
  const shouldShowTypeSelection = (showTypeSelection || showAddSegmentFlow) && !showActivityDefinition && !showActivityDetails;

  // Opciones de actividades predefinidas
  const activityOptions = [
    'Pausa',
    'Parada para hacer fotos',
    'Visita',
    'Tour guiado',
    'Tiempo libre',
    'Comida',
    'Transporte',
    'Check-in',
    'Check-out',
    'Actividad cultural',
    'Deportes',
    'Compras'
  ];

  // Filtrar opciones basadas en la búsqueda
  const filteredActivities = activityOptions.filter(activity =>
    activity.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sincronizar el estado local con el prop
  useEffect(() => {
    setLocalSelectedType(selectedType);
  }, [selectedType]);

  // Datos de ejemplo por defecto
  const defaultData: ItineraryData = {
    title: getTranslation('stepItinerary.example.title', language),
    start: {
      id: 'start',
      type: 'start',
      title: 'Lugar de salida:',
      description: 'Marina Turistica de Paracas'
    },
    end: {
      id: 'end',
      type: 'end',
      title: 'Regresa a:',
      description: 'Marina Turistica de Paracas'
    },
    items: [
      {
        id: '2',
        type: 'route',
        title: 'Deslizador / Transporte acuatico',
        duration: '15min'
      },
      {
        id: '3',
        type: 'activity',
        title: 'Candelabro de Paracas',
        subtitle: 'Parada para hacer fotos, Tour guiado, etc.',
        duration: '5min'
      },
      {
        id:'4',
        type: 'route',
        title: 'Deslizador / Transporte acuatico',
        duration: '15min'
      },
      {
        id: '5',
        type: 'activity',
        title: 'Islas ballestas',
        subtitle: 'Parada para hacer fotos, Tour guiado, etc.',
        duration: '30min'
      },
      {
        id:'6',
        type: 'route',
        title: 'Deslizador / Transporte acuatico',
        duration: '30min'
      }
    ]
  };

  // Estado local para manejar los datos cuando no hay callbacks
  const [localData, setLocalData] = useState<ItineraryData | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    itemId: string;
    x: number;
    y: number;
  } | null>(null);
  
  const itineraryData = data || localData || defaultData;

  const getItemIcon = (item: ItineraryItem, isSubItem: boolean = false) => {
    if (item.icon) {
      return <i className={item.icon}></i>;
    }
    
    if (isSubItem) {
      const config = SUB_ITEM_CONFIG[item.type as keyof typeof SUB_ITEM_CONFIG] || ITEM_TYPE_CONFIG[item.type];
      return <i className={config?.icon || 'fas fa-circle'}></i>;
    }
    
    const config = ITEM_TYPE_CONFIG[item.type];
    return <i className={config?.icon || 'fas fa-circle'}></i>;
  };

  const getItemColor = (item: ItineraryItem, isSubItem: boolean = false) => {
    if (item.color) {
      return item.color;
    }
    
    if (isSubItem) {
      const config = SUB_ITEM_CONFIG[item.type as keyof typeof SUB_ITEM_CONFIG] || ITEM_TYPE_CONFIG[item.type];
      return config?.color || 'bg-secondary text-white';
    }
    
    const config = ITEM_TYPE_CONFIG[item.type];
    return config?.color || 'bg-secondary text-white';
  };

  const getItemSize = (item: ItineraryItem, isSubItem: boolean = false) => {
    if (isSubItem) {
      const config = SUB_ITEM_CONFIG[item.type as keyof typeof SUB_ITEM_CONFIG] || ITEM_TYPE_CONFIG[item.type];
      return config?.size || '20px';
    }
    const config = ITEM_TYPE_CONFIG[item.type];
    return config?.size || '40px';
  };

  const getItemFontSize = (item: ItineraryItem, isSubItem: boolean = false) => {
    if (isSubItem) {
      const config = SUB_ITEM_CONFIG[item.type as keyof typeof SUB_ITEM_CONFIG] || ITEM_TYPE_CONFIG[item.type];
      return config?.fontSize || '8px';
    }
    const config = ITEM_TYPE_CONFIG[item.type];
    return config?.fontSize || '14px';
  };

  // Función para calcular la altura real de cualquier elemento considerando saltos de línea
  const calculateItemHeight = (item: ItineraryItem) => {
    let baseHeight = 24; // Altura base para título
    
    // Si tiene subtítulo, agregar altura adicional
    if (item.subtitle) {
      // Contar saltos de línea en el subtítulo
      const lineBreaks = (item.subtitle.match(/\n/g) || []).length;
      baseHeight += 16 + (lineBreaks * 16); // 16px por línea adicional
    }
    
    // Si tiene descripción, agregar altura adicional
    if (item.description) {
      const descLineBreaks = (item.description.match(/\n/g) || []).length;
      baseHeight += 16 + (descLineBreaks * 16); // 16px por línea adicional
    }
    
    // Si tiene duración, agregar altura adicional
    if (item.duration) {
      baseHeight += 4; // Espaciado adicional para duración
    }
    
    return Math.max(baseHeight, 32); // Mínimo 32px
  };

  // Función para calcular la altura real de una sub-actividad considerando saltos de línea
  const calculateSubItemHeight = (subItem: ItineraryItem) => {
    return calculateItemHeight(subItem);
  };

  const canRemoveItem = (item: ItineraryItem) => {
    // Los elementos start y end no se pueden eliminar
    return item.type !== 'start' && item.type !== 'end';
  };

  const canMoveItem = (item: ItineraryItem) => {
    // Los elementos start y end no se pueden mover
    return item.type !== 'start' && item.type !== 'end';
  };

  const canMoveItemUp = (item: ItineraryItem, index: number) => {
    // No se puede mover arriba si el elemento anterior es start
    if (index > 0 && itineraryData.items[index - 1].type === 'start') {
      return false;
    }
    return canMoveItem(item) && index > 0;
  };

  const canMoveItemDown = (item: ItineraryItem, index: number) => {
    // No se puede mover abajo si el elemento siguiente es end
    if (index < itineraryData.items.length - 1 && itineraryData.items[index + 1].type === 'end') {
      return false;
    }
    return canMoveItem(item) && index < itineraryData.items.length - 1;
  };

  const canMoveSubItemUp = (subItem: ItineraryItem, subIndex: number) => {
    return subIndex > 0;
  };

  const canMoveSubItemDown = (subItem: ItineraryItem, subIndex: number, totalSubItems: number) => {
    return subIndex < totalSubItems - 1;
  };

  const handleItemRemove = (itemId: string) => {
    if (onItemRemove) {
      onItemRemove(itemId);
    } else {
      // Si no hay callback, actualizar el estado local
      const updatedItems = itineraryData.items.filter(item => item.id !== itemId);
      setLocalData(prevData => ({
        ...prevData!,
        items: updatedItems
      }));
    }
  };

  const handleSubItemRemove = (itemId: string, subItemId: string) => {
    if (onSubItemRemove) {
      onSubItemRemove(itemId, subItemId);
    } else {
      // Si no hay callback, actualizar el estado local
      const updatedItems = itineraryData.items.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            subItems: item.subItems?.filter(subItem => subItem.id !== subItemId)
          };
        }
        return item;
      });
      setLocalData(prevData => ({
        ...prevData!,
        items: updatedItems
      }));
    }
  };

  const handleItemMoveUp = (itemId: string) => {
    if (onItemMoveUp) {
      onItemMoveUp(itemId);
    } else {
      // Si no hay callback, actualizar el estado local
      const currentIndex = itineraryData.items.findIndex(item => item.id === itemId);
      if (currentIndex > 0) {
        const newItems = [...itineraryData.items];
        [newItems[currentIndex - 1], newItems[currentIndex]] = [newItems[currentIndex], newItems[currentIndex - 1]];
        setLocalData(prevData => ({
          ...prevData!,
          items: newItems
        }));
      }
    }
  };

  const handleItemMoveDown = (itemId: string) => {
    if (onItemMoveDown) {
      onItemMoveDown(itemId);
    } else {
      // Si no hay callback, actualizar el estado local
      const currentIndex = itineraryData.items.findIndex(item => item.id === itemId);
      if (currentIndex < itineraryData.items.length - 1) {
        const newItems = [...itineraryData.items];
        [newItems[currentIndex], newItems[currentIndex + 1]] = [newItems[currentIndex + 1], newItems[currentIndex]];
        setLocalData(prevData => ({
          ...prevData!,
          items: newItems
        }));
      }
    }
  };

  const handleSubItemMoveUp = (itemId: string, subItemId: string) => {
    if (onSubItemMoveUp) {
      onSubItemMoveUp(itemId, subItemId);
    } else {
      // Si no hay callback, actualizar el estado local
      const updatedItems = itineraryData.items.map(item => {
        if (item.id === itemId && item.subItems) {
          const subIndex = item.subItems.findIndex(subItem => subItem.id === subItemId);
          if (subIndex > 0) {
            const newSubItems = [...item.subItems];
            [newSubItems[subIndex - 1], newSubItems[subIndex]] = [newSubItems[subIndex], newSubItems[subIndex - 1]];
            return { ...item, subItems: newSubItems };
          }
        }
        return item;
      });
      setLocalData(prevData => ({
        ...prevData!,
        items: updatedItems
      }));
    }
  };

  const handleSubItemMoveDown = (itemId: string, subItemId: string) => {
    if (onSubItemMoveDown) {
      onSubItemMoveDown(itemId, subItemId);
    } else {
      // Si no hay callback, actualizar el estado local
      const updatedItems = itineraryData.items.map(item => {
        if (item.id === itemId && item.subItems) {
          const subIndex = item.subItems.findIndex(subItem => subItem.id === subItemId);
          if (subIndex < item.subItems.length - 1) {
            const newSubItems = [...item.subItems];
            [newSubItems[subIndex], newSubItems[subIndex + 1]] = [newSubItems[subIndex + 1], newSubItems[subIndex]];
            return { ...item, subItems: newSubItems };
          }
        }
        return item;
      });
      setLocalData(prevData => ({
        ...prevData!,
        items: updatedItems
      }));
    }
  };

  const handleContextMenu = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    setContextMenu({
      itemId,
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleAddSegment = (itemId: string) => {
    // Activar el flujo de selección de tipo en lugar de agregar directamente
    setShowAddSegmentFlow(true);
    setLocalSelectedType(null); // Resetear la selección
    setContextMenu(null);
  };

  const handleRemoveSegment = (itemId: string) => {
    handleItemRemove(itemId);
    setContextMenu(null);
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // Función para calcular la posición Y del centro de un círculo
  const calculateCircleCenterY = (itemIndex: number, isStart: boolean = false, isEnd: boolean = false) => {
    let currentY = 20; // Posición inicial
    
    if (isStart) {
      return currentY + 20; // Centro del círculo START (radio 20px)
    }
    
    // Agregar altura del START
    currentY += 40 + 20; // Altura del círculo + margen
    
    // Si es el flujo de selección
    if (shouldShowTypeSelection && itemIndex === -1) {
      return currentY + 20; // Centro del círculo del flujo
    }
    
    // Agregar altura del flujo de selección si está visible
    if (shouldShowTypeSelection) {
      currentY += 200; // Altura aproximada del flujo de selección
    }
    
    // Agregar altura de los items del itinerario
    for (let i = 0; i < itemIndex; i++) {
      const item = itineraryData.items[i];
      const itemHeight = calculateItemHeight(item);
      currentY += itemHeight + 20; // Altura del item + margen
    }
    
    if (isEnd) {
      // Para el END, agregar altura de todos los items restantes
      for (let i = itemIndex; i < itineraryData.items.length; i++) {
        const item = itineraryData.items[i];
        const itemHeight = calculateItemHeight(item);
        currentY += itemHeight + 20; // Altura del item + margen
      }
      return currentY + 20; // Centro del círculo END
    }
    
    return currentY + 20; // Centro del círculo del item
  };

  return (
    <div className={className}>
      {/* Timeline */}
      <div className="position-relative">
        {/* Timeline items */}
        <div className="ms-5">
          {/* Start item */}
          {(() => {
            const item = itineraryData.start;
            const index = -1; // Start siempre es el primer elemento
            const hasSubItems = false; // Start nunca tiene sub-items
            const subItemsHeight = 0;
            const itemContentHeight = calculateItemHeight(item); // Altura del contenido considerando saltos de línea
            const totalItemHeight = itemContentHeight + subItemsHeight;
            
            return (
              <div key={item.id} className="position-relative">
                {/* Contenedor principal del elemento */}
                <div className="d-flex align-items-start mb-3">
                  <div 
                    className={`${getItemColor(item, false)} rounded-circle d-flex align-items-center justify-content-center me-3`}
                    style={{ 
                      width: getItemSize(item, false), 
                      height: getItemSize(item, false), 
                      fontSize: '14px', 
                      fontWeight: 'bold', 
                      zIndex: 2, 
                      position: 'relative',
                      flexShrink: 0
                    }}
                  >
                    {getItemIcon(item, false)}
                  </div>
                  
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="fw-bold text-black">
                          {item.title}
                        </div>
                        {item.subtitle && (
                          <div className="text-muted small">
                            {item.subtitle}
                            {item.type === 'activity' && item.duration && (
                              <span> - {item.duration}</span>
                            )}
                          </div>
                        )}
                        {item.description && (
                          <div className="text-muted small">{item.description}</div>
                        )}
                        {item.duration && item.type !== 'start' && item.type !== 'end' && item.type !== 'activity' && (
                          <span className="text-muted small">({item.duration})</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Línea de conexión al siguiente elemento */}
                {itineraryData.items.length > 0 && (() => {
                  const nextItem = itineraryData.items[0];
                  const nextItemHasSubItems = nextItem.subItems && nextItem.subItems.length > 0;
                  const nextItemSubItemsHeight = nextItemHasSubItems ? 
                    nextItem.subItems!.reduce((total, subItem) => total + calculateSubItemHeight(subItem), 0) + 16 : 0;
                  const nextItemHeight = 48 + nextItemSubItemsHeight;
                  
                  // Calcular la distancia exacta entre el centro del Start y el centro del siguiente elemento
                  const startCenterY = calculateCircleCenterY(-1, true, false);
                  let nextItemCenterY;
                  
                  if (shouldShowTypeSelection) {
                    // Si hay flujo de selección, conectar con él
                    nextItemCenterY = calculateCircleCenterY(-1, false, false);
                  } else if (itineraryData.items.length > 0) {
                    // Si hay items, conectar con el primero
                    nextItemCenterY = calculateCircleCenterY(0, false, false);
                  } else {
                    // Si no hay nada, conectar con END
                    nextItemCenterY = calculateCircleCenterY(-1, false, true);
                  }
                  
                  const lineHeight = nextItemCenterY - startCenterY;
                  
                  return (
                    <div 
                      className="position-absolute" 
                      style={{ 
                        left: '20px', 
                        top: `${startCenterY}px`,
                        width: '2px', 
                        height: `${lineHeight}px`,
                        backgroundColor: '#ff6b35', 
                        zIndex: 1 
                      }}
                    ></div>
                  );
                })()}
              </div>
            );
          })()}
          {/* Flujo de selección de tipo - Solo cuando se debe mostrar */}
          {shouldShowTypeSelection && (
            <div key="type-selection" className="position-relative mb-4">
               {/* Línea conectora desde START TO END*/}
               {(() => {
                 // Calcular la distancia exacta entre el centro del Start y el centro del END ATRAVESANDO EL FLUJO DE SELECCIÓN
                 const startCenterY = calculateCircleCenterY(-1, true, false);
                 const endCenterY = calculateCircleCenterY(-1, false, true);
                 const lineHeight  = endCenterY - startCenterY;
                
                return (
                  <div 
                    className="position-absolute" 
                    style={{ 
                      left: '20px', 
                      top: `${startCenterY}px`,
                      width: '3px', 
                      height: `${lineHeight}px`, 
                      backgroundColor: '#ff6b35',
                      zIndex: 1
                    }}
                  ></div>
                );
              })()}   
                         
              {/* Contenido del flujo de selección */}
              <div className="ms-5">
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-4">
                    <h5 className="mb-4 text-primary">
                      {getTranslation('stepItinerary.typeSelection.title', language)}
                    </h5>
                    
                    <div className="mb-4">
                      <div className="form-check mb-3">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="itineraryType"
                          id="activityType"
                          value="activity"
                          onChange={() => setLocalSelectedType('activity')}
                          checked={localSelectedType === 'activity'}
                        />
                        <label className="form-check-label" htmlFor="activityType">
                          <strong>{getTranslation('stepItinerary.typeSelection.activity.title', language)}</strong>
                          <br />
                          <small className="text-muted">
                            {getTranslation('stepItinerary.typeSelection.activity.description', language)}
                          </small>
                        </label>
                      </div>
                      
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="itineraryType"
                          id="transferType"
                          value="transfer"
                          onChange={() => setLocalSelectedType('transfer')}
                          checked={localSelectedType === 'transfer'}
                        />
                        <label className="form-check-label" htmlFor="transferType">
                          <strong>{getTranslation('stepItinerary.typeSelection.transfer.title', language)}</strong>
                          <br />
                          <small className="text-muted">
                            {getTranslation('stepItinerary.typeSelection.transfer.description', language)}
                          </small>
                        </label>
                      </div>
                    </div>
                    
                    <div className="d-flex justify-content-between">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          if (showAddSegmentFlow) {
                            setShowAddSegmentFlow(false);
                          } else if (onTypeSelectionBack) {
                            onTypeSelectionBack();
                          }
                        }}
                      >
                        <i className="fas fa-arrow-left me-2"></i>
                        {getTranslation('common.back', language)}
                      </button>
                      
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          alert("hola")
                          console.log('localSelectedType:', localSelectedType);
                          console.log('onTypeSelect:', onTypeSelect);
                          
                          if (localSelectedType) {
                            // Llamar a onTypeSelect si está definido
                            if (onTypeSelect) {
                              onTypeSelect(localSelectedType);
                            }
                            
                            // Si es una actividad, mostrar el flujo de definición
                            if (localSelectedType === 'activity') {
                              console.log('Activando flujo de definición de actividad');
                              setShowActivityDefinition(true);
                              // Cerrar el flujo de selección de tipo
                              setShowAddSegmentFlow(false);
                              console.log('showActivityDefinition debería ser true ahora');
                            } else {
                              // Si es traslado, agregar directamente
                              if (onAddItem) {
                                const newItem: ItineraryItem = {
                                  id: `new-${Date.now()}`,
                                  type: 'route',
                                  title: 'Nuevo traslado',
                                  description: 'Descripción del traslado'
                                };
                                onAddItem(newItem);
                              }
                              
                              // Cerrar el flujo de selección
                              setShowAddSegmentFlow(false);
                              setLocalSelectedType(null);
                            }
                          } else {
                            console.log('No hay tipo seleccionado');
                          }
                        }}
                        disabled={!localSelectedType}
                      >
                        {getTranslation('common.next', language)}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Flujo de definición de actividad - Solo cuando se debe mostrar */}
          {showActivityDefinition && (() => {
            console.log('Renderizando flujo de definición de actividad');
            return (
              <div key="activity-definition" className="position-relative mb-4">
              {/* Línea conectora desde START TO END*/}
              {(() => {
                // Calcular la distancia exacta entre el centro del Start y el centro del END ATRAVESANDO EL FLUJO DE DEFINICIÓN
                const startCenterY = calculateCircleCenterY(-1, true, false);
                const endCenterY = calculateCircleCenterY(-1, false, true);
                const lineHeight  = endCenterY - startCenterY;
                
                return (
                  <div 
                    className="position-absolute" 
                    style={{ 
                      left: '20px', 
                      top: `${startCenterY}px`,
                      width: '3px', 
                      height: `${lineHeight}px`, 
                      backgroundColor: '#ff6b35',
                      zIndex: 1
                    }}
                  ></div>
                );
              })()}   
                          
              {/* Contenido del flujo de definición de actividad */}
              <div className="ms-5">
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-4">
                    <h5 className="mb-4 text-primary">
                      ¿Qué sucede durante esta parte de la experiencia?
                    </h5>
                    
                    <p className="mb-4 text-muted">
                      Indica lo que sucede durante esta parte de tu experiencia en la barra de búsqueda a continuación.
                    </p>
                    
                    <div className="mb-4">
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="fas fa-search"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Introduce la actividad aquí"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button className="btn btn-link text-primary">
                          Seleccionar de la lista
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-4" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {filteredActivities.map((activity, index) => (
                        <div key={index} className="form-check mb-2">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="activitySelection"
                            id={`activity-${index}`}
                            value={activity}
                            onChange={() => setSelectedActivity(activity)}
                            checked={selectedActivity === activity}
                          />
                          <label className="form-check-label" htmlFor={`activity-${index}`}>
                            {activity}
                          </label>
                        </div>
                      ))}
                    </div>
                    
                    <div className="d-flex justify-content-between">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowActivityDefinition(false);
                          setSelectedActivity('');
                          setSearchQuery('');
                        }}
                      >
                        <i className="fas fa-arrow-left me-2"></i>
                        {getTranslation('common.back', language)}
                      </button>
                      
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          if (selectedActivity) {
                            console.log('Activando flujo de detalles de actividad');
                            // Continuar con el siguiente paso de detalles de la actividad
                            setShowActivityDetails(true);
                          }
                        }}
                        disabled={!selectedActivity}
                      >
                        {getTranslation('common.next', language)}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            );
          })()}
          
          {/* Flujo de detalles de actividad - Solo cuando se debe mostrar */}
          {showActivityDetails && (
            <div key="activity-details" className="position-relative mb-4">
              {/* Línea conectora desde START TO END*/}
              {(() => {
                // Calcular la distancia exacta entre el centro del Start y el centro del END ATRAVESANDO EL FLUJO DE DETALLES
                const startCenterY = calculateCircleCenterY(-1, true, false);
                const endCenterY = calculateCircleCenterY(-1, false, true);
                const lineHeight  = endCenterY - startCenterY;
                
                return (
                  <div 
                    className="position-absolute" 
                    style={{ 
                      left: '20px', 
                      top: `${startCenterY}px`,
                      width: '3px', 
                      height: `${lineHeight}px`, 
                      backgroundColor: '#ff6b35',
                      zIndex: 1
                    }}
                  ></div>
                );
              })()}   
                          
              {/* Contenido del flujo de detalles de actividad */}
              <div className="ms-5">
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-4">
                    <h5 className="mb-4 text-primary">
                      ¿Qué sucede durante esta parte de la experiencia?
                    </h5>
                    
                    <p className="mb-4 text-muted">
                      Indica lo que sucede durante esta parte de tu experiencia en la barra de búsqueda a continuación.
                    </p>
                    
                    <div className="mb-4">
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="fas fa-search"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Introduce la actividad aquí"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button className="btn btn-link text-primary">
                          • Seleccionar de la lista
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-4" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {filteredActivities.map((activity, index) => (
                        <div key={index} className="form-check mb-2">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="activitySelectionDetails"
                            id={`activity-details-${index}`}
                            value={activity}
                            onChange={() => setSelectedActivity(activity)}
                            checked={selectedActivity === activity}
                          />
                          <label className="form-check-label" htmlFor={`activity-details-${index}`}>
                            {activity}
                          </label>
                        </div>
                      ))}
                    </div>
                    
                    <div className="d-flex justify-content-between">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowActivityDetails(false);
                        }}
                      >
                        <i className="fas fa-arrow-left me-2"></i>
                        {getTranslation('common.back', language)}
                      </button>
                      
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          if (selectedActivity && onAddItem) {
                            const newItem: ItineraryItem = {
                              id: `new-${Date.now()}`,
                              type: 'activity',
                              title: selectedActivity,
                              description: `Descripción de ${selectedActivity}`
                            };
                            onAddItem(newItem);
                          }
                          
                          // Cerrar todos los flujos
                          setShowActivityDetails(false);
                          setShowActivityDefinition(false);
                          setShowAddSegmentFlow(false);
                          setLocalSelectedType(null);
                          setSelectedActivity('');
                          setSearchQuery('');
                        }}
                        disabled={!selectedActivity}
                      >
                        {getTranslation('common.next', language)}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Middle items */}
          {itineraryData.items.map((item, index) => {
            // Calcular la altura total del elemento incluyendo sub-items
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const itemContentHeight = calculateItemHeight(item); // Altura del contenido principal considerando saltos de línea
            const subItemsHeight = hasSubItems ? 
              item.subItems!.reduce((total, subItem) => total + calculateSubItemHeight(subItem), 0) + 16 : 0; // Altura real de sub-items + 16px de margen
            const totalItemHeight = itemContentHeight + subItemsHeight; // Altura del contenido + altura de sub-items
            
            return (
              <div key={item.id} className="position-relative">
                {/* Contenedor principal del elemento */}
                <div className="d-flex align-items-start mb-3">
                  <div 
                    className={`${getItemColor(item, false)} rounded-circle d-flex align-items-center justify-content-center me-3`}
                    style={{ 
                      width: getItemSize(item, false), 
                      height: getItemSize(item, false), 
                      fontSize: getItemFontSize(item, false), 
                      fontWeight: 'bold', 
                      zIndex: 2, 
                      position: 'relative',
                      flexShrink: 0
                    }}
                  >
                    {getItemIcon(item, false)}
                  </div>
                  
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="fw-bold text-bold">
                        {item.title}
                      </div>
                      {item.subtitle && (
                        <div className="text-muted small">
                          {item.subtitle}
                          {item.duration && (
                            <span> - {item.duration}</span>
                          )}
                        </div>
                      )}
                      {item.description && (
                        <div className="text-muted small">{item.description}</div>
                      )}
                      {item.duration && item.type !== 'start' && item.type !== 'end' && item.type !== 'activity' && (
                        <span className="text-muted small">({item.duration})</span>
                      )}
                    </div>
                      
                      {/* Botones de control del elemento principal - Solo para actividades y rutas */}
                      {editable && item.type !== 'start' && item.type !== 'end' && (
                        <div className="d-flex gap-1">
                          {/* Botones de movimiento */}
                          {canMoveItem(item) && (
                            <>
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => handleItemMoveUp(item.id)}
                                disabled={!canMoveItemUp(item, index)}
                                title="Mover arriba"
                              >
                                <i className="fas fa-arrow-up"></i>
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => handleItemMoveDown(item.id)}
                                disabled={!canMoveItemDown(item, index)}
                                title="Mover abajo"
                              >
                                <i className="fas fa-arrow-down"></i>
                              </button>
                            </>
                          )}
                          
                          {/* Menú contextual */}
                          <div className="dropdown">
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={(e) => handleContextMenu(e, item.id)}
                              title="Opciones"
                            >
                              <i className="fas fa-ellipsis-h"></i>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Sub-items */}
                    {hasSubItems && (
                      <div className="ms-4 mt-2 position-relative">
                        {item.subItems!.map((subItem, subIndex) => {
                          const isLastSubItem = subIndex === item.subItems!.length - 1;
                          const subItemHeight = calculateItemHeight(subItem);
                          
                          return (
                            <div key={subItem.id} className="position-relative">
                              {/* Contenedor principal del sub-item */}
                              <div className="d-flex align-items-start mb-2">
                                <div 
                                  className={`${getItemColor(subItem, true)} rounded-circle d-flex align-items-center justify-content-center me-2`}
                                  style={{ 
                                    width: getItemSize(subItem, true), 
                                    height: getItemSize(subItem, true), 
                                    fontSize: getItemFontSize(subItem, true),
                                    fontWeight: 'bold',
                                    zIndex: 2, 
                                    position: 'relative',
                                    flexShrink: 0
                                  }}
                                >
                                  {getItemIcon(subItem, true)}
                                </div>
                                
                                <div className="flex-grow-1">
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                      <div className="fw-bold text-black small">
                                        {subItem.title}
                                      </div>
                                      {subItem.subtitle && (
                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                          {subItem.subtitle}
                                          {subItem.duration && (
                                            <span> - {subItem.duration}</span>
                                          )}
                                        </div>
                                      )}
                                      {subItem.description && (
                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{subItem.description}</div>
                                      )}
                                      {subItem.duration && !subItem.subtitle && (
                                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>({subItem.duration})</span>
                                      )}
                                    </div>
                                    
                                    {/* Botones de control del sub-item */}
                                    {editable && (
                                      <div className="d-flex gap-1">
                                        {/* Botones de movimiento */}
                                        <button
                                          type="button"
                                          className="btn btn-outline-secondary btn-sm"
                                          onClick={() => handleSubItemMoveUp(item.id, subItem.id)}
                                          disabled={!canMoveSubItemUp(subItem, subIndex)}
                                          title="Mover arriba"
                                          style={{ fontSize: '10px', padding: '2px 6px' }}
                                        >
                                          <i className="fas fa-arrow-up"></i>
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-outline-secondary btn-sm"
                                          onClick={() => handleSubItemMoveDown(item.id, subItem.id)}
                                          disabled={!canMoveSubItemDown(subItem, subIndex, item.subItems!.length)}
                                          title="Mover abajo"
                                          style={{ fontSize: '10px', padding: '2px 6px' }}
                                        >
                                          <i className="fas fa-arrow-down"></i>
                                        </button>
                                        
                                        {/* Botón de eliminar */}
                                        <button
                                          type="button"
                                          className="btn btn-outline-danger btn-sm"
                                          onClick={() => handleSubItemRemove(item.id, subItem.id)}
                                          title="Eliminar sub-elemento"
                                          style={{ fontSize: '10px', padding: '2px 6px' }}
                                        >
                                          <i className="fas fa-times"></i>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Línea de conexión al siguiente sub-item */}
                              {!isLastSubItem && (
                                <div 
                                  className="position-absolute" 
                                  style={{ 
                                    left: '10px', 
                                    top: '10px',
                                    width: '2px', 
                                    height: `${subItemHeight + 8}px`,
                                    backgroundColor: '#ff6b35', 
                                    zIndex: 1 
                                  }}
                                ></div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Línea de conexión al siguiente elemento */}
                {(index < itineraryData.items.length - 1 || (index === itineraryData.items.length - 1 && itineraryData.end)) && (() => {
                  // Calcular la altura necesaria para llegar al centro del siguiente elemento
                  const nextItem = index < itineraryData.items.length - 1 
                    ? itineraryData.items[index + 1] 
                    : itineraryData.end;
                  const nextItemHasSubItems = nextItem.subItems && nextItem.subItems.length > 0;
                  const nextItemSubItemsHeight = nextItemHasSubItems ? 
                    nextItem.subItems!.reduce((total, subItem) => total + calculateSubItemHeight(subItem), 0) + 16 : 0;
                  const nextItemHeight = 48 + nextItemSubItemsHeight;
                  
                  // Calcular la distancia exacta entre centros
                  const currentItemCenterY = 20; // Centro del círculo actual (40px / 2)
                  const currentItemBottom = totalItemHeight; // Fondo del elemento actual
                  const marginBetween = 20; // Margen entre elementos
                  const nextItemCenterY = 20; // Centro del círculo del siguiente elemento
                  
                  // La línea va desde el centro del elemento actual hasta el centro del siguiente
                  const lineStartY = currentItemCenterY;
                  const lineEndY = currentItemBottom + marginBetween + nextItemCenterY;
                  const lineHeight = lineEndY - lineStartY;
                  
                  return (
                    <div 
                      className="position-absolute" 
                      style={{ 
                        left: '20px', 
                        top: `${lineStartY}px`,
                        width: '2px', 
                        height: `${lineHeight}px`,
                        backgroundColor: '#ff6b35', 
                        zIndex: 1 
                      }}
                    ></div>
                  );
                })()}
              </div>
            );
          })}
          
          {/* End item */}
          {itineraryData.end && (() => {
            const item = itineraryData.end;
            const index = itineraryData.items.length; // End siempre es el último elemento
            const hasSubItems = false; // End nunca tiene sub-items
            const subItemsHeight = 0;
            const itemContentHeight = calculateItemHeight(item); // Altura del contenido considerando saltos de línea
            const totalItemHeight = itemContentHeight + subItemsHeight;
            
            return (
              <div key={item.id} className="position-relative">
                {/* Contenedor principal del elemento */}
                <div className="d-flex align-items-start mb-3">
                  <div 
                    className={`${getItemColor(item, false)} rounded-circle d-flex align-items-center justify-content-center me-3`}
                    style={{ 
                      width: getItemSize(item, false), 
                      height: getItemSize(item, false), 
                      fontSize: '14px', 
                      fontWeight: 'bold', 
                      zIndex: 2, 
                      position: 'relative',
                      flexShrink: 0
                    }}>
                    {getItemIcon(item, false)}
                  </div>
                  
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="fw-bold text-black">
                          {item.title}
                        </div>
                        {item.subtitle && (
                          <div className="text-muted small">
                            {item.subtitle}
                            {item.type === 'activity' && item.duration && (
                              <span> - {item.duration}</span>
                            )}
                          </div>
                        )}
                        {item.description && (
                          <div className="text-muted small">{item.description}</div>
                        )}
                        {item.duration && item.type !== 'start' && item.type !== 'end' && item.type !== 'activity' && (
                          <span className="text-muted small">({item.duration})</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Botón para agregar segmento entre Start y End */}
      {editable && (() => {
        // Encontrar los segmentos (solo actividades y rutas)
        const segments = itineraryData.items.filter(item => 
          item.type === 'activity' || item.type === 'route'
        );
        
        if (segments.length > 0) {
          // Si hay segmentos, mostrar el botón después del último segmento
          const lastSegment = segments[segments.length - 1];
          return (
            <div className="d-flex justify-content-start my-3">
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={() => handleAddSegment(lastSegment.id)}
                title="Agregar nuevo segmento"
              >
                <i className="fas fa-plus me-2"></i>
                Agregar nuevo segmento
              </button>
            </div>
          );
        } else {
          // Si no hay segmentos, mostrar el botón después del Start
          return (
            <div className="d-flex justify-content-start">
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={() => handleAddSegment('start')}
                title="Agregar nuevo segmento"
              >
                <i className="fas fa-plus me-2"></i>
                Agregar nuevo segmento
              </button>
            </div>
          );
        }
      })()}

      {/* Menú contextual */}
      {contextMenu && (
        <div
          className="position-fixed bg-white border shadow-lg rounded"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 1000,
            minWidth: '150px'
          }}
        >
          <div className="p-2">
            <button
              className="btn btn-link btn-sm w-100 text-start d-flex align-items-center"
              onClick={() => handleAddSegment(contextMenu.itemId)}
            >
              <i className="fas fa-plus me-2"></i>
              Agregar Segmento
            </button>
            {canRemoveItem(itineraryData.items.find(item => item.id === contextMenu.itemId)!) && (
              <button
                className="btn btn-link btn-sm w-100 text-start d-flex align-items-center text-danger"
                onClick={() => handleRemoveSegment(contextMenu.itemId)}
              >
                <i className="fas fa-trash me-2"></i>
                Eliminar Segmento
              </button>
            )}
          </div>
        </div>
      )}

      {/* Overlay para cerrar el menú contextual */}
      {contextMenu && (
        <div
          className="position-fixed"
          style={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={closeContextMenu}
        />
      )}
    </div>
  );
};

export default ItinerarySchedule;