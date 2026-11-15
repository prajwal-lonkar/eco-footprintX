import React, { useRef, useState, useEffect } from 'react';
import styles from './HowToRecycle.module.scss';
import { updateProductImageOrInstructions } from '@service/company.service';
import { useParams } from 'react-router-dom';
import add from '@assets/images/addstep.svg';
import deleteIcon from '@assets/icons/trash.svg';
import dragIcon from '@assets/icons/menu.svg';
import { hasLeadingOrTrailingSpaces } from '@utils/validation';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@constants/messages';
import CommonModal from '@components/modals/CommonModal/CommonModal';
import { useAlertStore } from '@store/useAlertStore';
import { BiEditAlt } from 'react-icons/bi';
import type { HowToRecycleProps, StepType } from '@type/companyDashboard';
import Bugsnag from '@utils/bugsnag';
const HowToRecycle: React.FC<HowToRecycleProps> = ({
  productDetails,
  setProductDetails,
}) => {
  
const params = useParams<{ productId: string }>();
const productId: string = params.productId ?? '';

  const [steps, setSteps] = useState<StepType[]>([]);
  const [originalSteps, setOriginalSteps] = useState<StepType[]>([]);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [showDeleteInstructionModal, setShowDeleteInstructionModal] =
    useState(false);

  const { showAlert } = useAlertStore();
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const validateStepField = (
    field: 'componentName' | 'disposal',
    value: string,
    stepId: string,
    includeLeadingTrailingSpaceValidation = true
  ) => {
    let error = '';
    const key = `${field}_${stepId}`;

    if (
      includeLeadingTrailingSpaceValidation &&
      hasLeadingOrTrailingSpaces(value)
    ) {
      error = ERROR_MESSAGES.LEADING_TRAILING_SPACES;
    } else if (field === 'componentName' && value.length > 150) {
      error = ERROR_MESSAGES.COMPONENT_NAME_TOO_LONG;
    } else if (field === 'disposal' && value.length > 150) {
      error = ERROR_MESSAGES.DISPOSAL_INSTRUCTION_TOO_LONG;
    }

    if (error) {
      setErrors((prev) => ({ ...prev, [key]: error }));
    } else {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    }
  };

  // Load product instructions initially
  useEffect(() => {
    if (editingStepId !== null || steps.some((s) => s.isNew)) {
      return;
    }
    if (productDetails?.recycleInstructions) {
      const formattedSteps = productDetails.recycleInstructions.map((r) => ({
        id: r._id,
        componentName: r.component,
        disposal: r.instructions,
      }));
      setSteps(formattedSteps);
      setOriginalSteps(formattedSteps);
    }
  }, [productDetails]);

  // Drag Drop Sort
  const handleSort = () => {
    let _steps = [...steps];
    const draggedItemContent = _steps[dragItem.current!];
    _steps.splice(dragItem.current!, 1);
    _steps.splice(dragOverItem.current!, 0, draggedItemContent);

    dragItem.current = null;
    dragOverItem.current = null;

    setSteps(_steps);
  };

  // Add new step
  const handleAddStep = () => {
    if (steps.length >= 10) return;

    const newStep = {
      id: Date.now().toString(),
      componentName: '',
      disposal: '',
      isNew: true,
    };

    setSteps((prev) => [...prev, newStep]);
    setEditingStepId(newStep.id);
  };

  const [stepToDelete, setStepToDelete] = useState<string | null>(null);

  const handleDeleteClick = (step: StepType) => {
    if (step.isNew) {
      const updatedSteps = steps.filter((s) => s.id !== step.id);
      setSteps(updatedSteps);

      // Keep edit mode if another new/edit step exists
      const stillEditing =
        updatedSteps.some((s) => s.isNew) || editingStepId !== step.id;

      if (!stillEditing) {
        setEditingStepId(null);
      }

      setEditingStepId(null);
      setErrors({});
      return;
    }

    // Existing instruction → MODAL OPENS
    setStepToDelete(step.id);

    setShowDeleteInstructionModal(true);
  };

  const deleteInstructionsToApi = async (updatedSteps: StepType[]) => {
    const payload = updatedSteps.map((s) => ({
      component: s.componentName,
      instructions: s.disposal,
    }));

    //  SAME API — empty array is valid
    const res = await updateProductImageOrInstructions(productId, {
      recycleInstructions: payload,
    });

    return res;
  };

  const handleConfirmDeleteStep = async () => {
    if (!stepToDelete) return;

    const updatedSteps = steps.filter((s) => s.id !== stepToDelete);

    try {
      // API CALL — EMPTY ARRAY IF LAST ITEM

      const response = await deleteInstructionsToApi(updatedSteps);

      if (response?.status === 200) {
        setSteps(updatedSteps);
        setOriginalSteps(updatedSteps);
        setProductDetails((prev: any) => ({
          ...prev,
          recycleInstructions: updatedSteps.map((s) => ({
            _id: s.id,
            component: s.componentName,
            instructions: s.disposal,
          })),
        }));
        setEditingStepId(null);

        showAlert(SUCCESS_MESSAGES.RECYCLE_INSTRUCTION_DELETED_SUCCESSFULLY);
      }
    } catch (error) {
      Bugsnag.notify(error as Error, (event) => {
        event.addMetadata('context', {
          component: 'HowToRecycle',
          method: 'handleConfirmDeleteStep',
          productId,
        });
      });
      showAlert(ERROR_MESSAGES.FAILED_TO_DELETE_INSTRUCTION);
    } finally {
      setStepToDelete(null);
      setShowDeleteInstructionModal(false);
    }
  };

  const handleDiscard = () => {
    setSteps(originalSteps);

    // Reset edit state
    setEditingStepId(null);

    // Clear validation errors
    setErrors({});
  };

  // Save Changes
  const handleSave = async () => {
   const hasNewSteps = steps.some((s) => s.isNew);

    try {
      const payload = steps.map((s) => ({
        component: s.componentName,
        instructions: s.disposal,
      }));

      // const res = await updateProductImageOrInstructions(productId, payload);
      const res = await updateProductImageOrInstructions(productId, {
        recycleInstructions: payload,
      });

      if (res?.status === 200) {
        const updatedSteps = steps.map((s) => ({
          ...s,
          isNew: false,
        }));

        setSteps(updatedSteps);
        setOriginalSteps(updatedSteps);

        setProductDetails((prev: any) => ({
          ...prev,
          recycleInstructions: updatedSteps.map((s) => ({
            _id: s.id,
            component: s.componentName,
            instructions: s.disposal,
          })),
        }));

        setEditingStepId(null);

        setErrors({});

        showAlert(
          hasNewSteps
            ? SUCCESS_MESSAGES.RECYCLE_INSTRUCTION_ADDED_SUCCESSFULLY
            : SUCCESS_MESSAGES.RECYCLE_INSTRUCTION_UPDATE_UCCESSFULLY 
        );
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      Bugsnag.notify(error as Error, (event) => {
        event.addMetadata('context', {
          component: 'HowToRecycle',
          method: 'handleSave',
          productId,
        });
      });
      showAlert(
        hasNewSteps
          ? ERROR_MESSAGES.FAILED_TO_ADD_RECYCLE_INSTRUCTION
          : ERROR_MESSAGES.FAILED_TO_UPDATE_RECYCLE_INSTRUCTION ,
        'danger'
      );
    }
  };

  const isSaveDisabled =
    Object.keys(errors).length > 0 ||
    steps.some(
      (s) =>
        !s.componentName.trim() ||
        !s.disposal.trim() ||
        !steps.some((s) => s.dirty) ||
        hasLeadingOrTrailingSpaces(s.componentName) ||
        hasLeadingOrTrailingSpaces(s.disposal)
    );
  const isAddingNewStep =
    editingStepId !== null || steps.some((step) => step.isNew);

  return (
    <div style={{ width: '100%' }}>
      <div className={styles.howToRecycleSteps}>
        {steps.map((step, index) => {
          const isEditing = step.isNew || editingStepId === step.id;
          return (
            <div
              key={step.id}
              className={styles.instructionBox}
              onDragEnter={() => (dragOverItem.current = index)}
              onDragEnd={handleSort}
              onDragOver={(e) => e.preventDefault()}
            >
              {/*        VIEW MODE (AFTER SAVE)     */}

              {!isEditing && (
                <div key={step.id} className={styles.instructionBox}>
                  <div className={styles.instructionContent}>
                    <div className={styles.instructioWrapper}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h2>{step.componentName}</h2>
                        <p>{step.disposal}</p>
                      </div>

                      <div className={styles.btnWrap}>
                        <div
                          className={styles.editBtn}
                          onClick={() => {
                            setSteps((prev) => prev.filter((s) => !s.isNew));

                            setErrors({});

                            setEditingStepId(step.id);
                          }}
                        >
                          <BiEditAlt
                            style={{ width: '16px', height: '16px' }}
                          />{' '}
                        </div>

                        <div
                          className={styles.deleteBtn}
                          onClick={() => handleDeleteClick(step)}
                        >
                          <img src={deleteIcon} alt="delete" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/*       EDIT MODE (DEFAULT)         */}

              {isEditing ? (
                <>
                  {step.isNew && (
                    <div className={styles.leftDragHandle}>
                      <img
                        src={dragIcon}
                        alt="drag"
                        draggable
                        style={{ cursor: 'grab' }}
                        onDragStart={(e) => {
                          dragItem.current = index;
                          const box = e.currentTarget.closest(
                            `.${styles.instructionBox}`
                          ) as HTMLElement;
                          const crt = box.cloneNode(true) as HTMLElement;
                          crt.style.position = 'absolute';
                          crt.style.top = '-9999px';
                          crt.style.left = '-9999px';
                          crt.style.width = `${box.offsetWidth}px`;
                          document.body.appendChild(crt);
                          e.dataTransfer.setDragImage(crt, 10, 10);
                        }}
                      />
                    </div>
                  )}
                  <div className={styles.instructionContent}>
                    <div className={styles.inputWrapper}>
                      <label>
                        Component Name{' '}
                        <span className={styles.required}>*</span>{' '}
                      </label>
                      <input
                        type="text"
                        value={step.componentName}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSteps((prev) =>
                            prev.map((s) =>
                              s.id === step.id
                                ? {
                                    ...s,
                                    componentName: e.target.value,
                                    dirty: true,
                                  }
                                : s
                            )
                          );
                          validateStepField(
                            'componentName',
                            value,
                            step.id,
                            false
                          );
                        }}
                        onPaste={(e) => {
                          const pastedText = e.clipboardData.getData('text');
                          validateStepField(
                            'componentName',
                            pastedText,
                            step.id,
                            false
                          );
                        }}
                        onFocus={() =>
                          setFocusedField(`componentName_${step.id}`)
                        }
                        onBlur={(e) => {
                          setFocusedField(null);
                          validateStepField(
                            'componentName',
                            e.target.value,
                            step.id
                          );
                        }}
                        className={`${styles.inputDefault} ${
                          errors[`componentName_${step.id}`]
                            ? styles.inputError
                            : focusedField === `componentName_${step.id}`
                              ? styles.inputValid
                              : ''
                        }`}
                      />
                      {errors[`componentName_${step.id}`] && (
                        <p className={styles.error}>
                          {errors[`componentName_${step.id}`]}
                        </p>
                      )}
                    </div>

                    <div className={styles.inputWrapper}>
                      <div className="d-flex justify-content-between w-100">
                        <label>
                          Describe Disposal Instructions{' '}
                          <span className={styles.required}>*</span>{' '}
                        </label>
                        <div className={styles.charCount}>
                          {step.disposal.length}/150
                        </div>
                      </div>

                      <input
                        type="text"
                        value={step.disposal}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSteps((prev) =>
                            prev.map((s) =>
                              s.id === step.id
                                ? {
                                    ...s,
                                    disposal: e.target.value,
                                    dirty: true,
                                  }
                                : s
                            )
                          );
                          validateStepField(
                            'disposal',
                            value,
                            step.id,
                            false
                          );
                        }}
                        onPaste={(e) => {
                          const pastedText = e.clipboardData.getData('text');
                          validateStepField(
                            'disposal',
                            pastedText,
                            step.id,
                            false
                          );
                        }}
                        onFocus={() => setFocusedField(`disposal_${step.id}`)}
                        onBlur={(e) => {
                          setFocusedField(null);
                          validateStepField('disposal', e.target.value, step.id);
                        }}
                        className={`${styles.inputDefault} ${
                          errors[`disposal_${step.id}`]
                            ? styles.inputError
                            : focusedField === `disposal_${step.id}`
                              ? styles.inputValid
                              : ''
                        }`}
                      />
                      {errors[`disposal_${step.id}`] && (
                        <p className={styles.error}>
                          {errors[`disposal_${step.id}`]}
                        </p>
                      )}
                    </div>
                  </div>

                  <div
                    className={styles.deleteBtn}
                    onClick={() => handleDeleteClick(step)}
                  >
                    <img src={deleteIcon} alt="delete" />
                  </div>
                </>
              ) : null}
            </div>
          );
        })}

        {/* Add New Instruction */}
        {steps.length < 10 && (
          <div className={styles.instructionBox}>
            <div
              className={`${styles.contentWidth} ${
                editingStepId ? styles.constrained : styles.fullWidth
              }`}
            >
              {/* Drag Placeholder */}
              <div
                className={
                  // If editing an existing instruction → hide drag placeholder
                  editingStepId &&
                  !steps.find((s) => s.id === editingStepId)?.isNew
                    ? styles.noPlaceholder
                    : isAddingNewStep
                      ? styles.dragPlaceholder
                      : styles.noPlaceholder
                }
              />

              <div className={styles.addSteps} onClick={handleAddStep}>
                <img src={add} alt="add" />
                <div className={styles.titleWrapper}>
                  <h2>Add New Instruction</h2>

                  {steps.length === 0 && (
                    <h3 className={styles.showText}>
                      Start adding instructions
                    </h3>
                  )}
                </div>
              </div>

              <div
                className={
                  isAddingNewStep
                    ? styles.deletePlaceholder
                    : styles.noPlaceholder
                }
              />
            </div>
          </div>
        )}

        {/* Save / Discard */}
        {(editingStepId !== null || isAddingNewStep) && (
          <div className={styles.BtnWrapper}>
            <button className={styles.discardBtn} onClick={handleDiscard}>
              Discard Changes
            </button>
            <button
              className={styles.saveChangesBtn}
              onClick={handleSave}
              disabled={isSaveDisabled}
            >
              Save Changes
            </button>
          </div>
        )}
      </div>

      {showDeleteInstructionModal && (
        <div className={styles.modalWrapper}>
          <CommonModal
            icon={deleteIcon}
            title="Are you sure you want to delete this instruction?"
            message="This will remove the recycling instruction for your product. This action cannot be undone."
            cancelText="Cancel"
            confirmText="Delete"
            onCancel={() => {
              setShowDeleteInstructionModal(false);
              setStepToDelete(null);
            }}
            onConfirm={handleConfirmDeleteStep}
            confirmBtnClass={styles.removeButton}
          />
        </div>
      )}
    </div>
  );
};

export default HowToRecycle;

