import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import StepOne from '@pages/auth/SignUp/SignUpSteps/UserInfoForm/UserInfoForm';
import StepTwo from '@pages/auth/SignUp/SignUpSteps/AdditionalInfoForm/AdditionalInfoForm';
import SetPasswordForm from '@pages/auth/SignUp/SignUpSteps/SetPasswordForm/SetPasswordForm';
import OtpVerification from '@pages/auth/SignUp/SignUpSteps/OtpVerification/OtpVerification';
import axiosInstance from '@service/api.service';
import { ENDPOINTS } from '@constants/endpoint';
import { ERROR_MESSAGES } from '@constants/messages';
import { useAlertStore } from '@store/useAlertStore';
import type { CreateUserPayload, CreateUserResponse } from '@type/auth';
import Bugsnag from '@utils/bugsnag';

import styles from './SignUp.module.scss';
import RestrictedUser from './RestrictedUser/RestrictedUser';
import { ROUTES } from '@constants/routes';

const SignUpStep = {
  USER_INFO: 1,
  ADDITIONAL_INFO: 2,
  SET_PASSWORD: 3,
  OTP_VERIFICATION: 4,
  RESTRICTED_USER: 5,
} as const;

interface SignUpFormData {
  contactName: string;
  email: string;
  companyName: string;
  website: string;
  address: string;
  industryType: string;
  companyType: string;
  registrationNumber: string;
  dunsNumber: string;
  password: string;
  confirmPassword: string;
}

type UserInfoStepSnapshot = Pick<
  SignUpFormData,
  'companyName' | 'email' | 'contactName'
>;

type AdditionalInfoStepSnapshot = Pick<
  SignUpFormData,
  | 'website'
  | 'industryType'
  | 'companyType'
  | 'registrationNumber'
  | 'dunsNumber'
  | 'address'
>;

type ValidatedStepSnapshots = {
  [SignUpStep.USER_INFO]?: UserInfoStepSnapshot;
  [SignUpStep.ADDITIONAL_INFO]?: AdditionalInfoStepSnapshot;
};

const getUserInfoStepSnapshot = (
  formData: SignUpFormData
): UserInfoStepSnapshot => ({
  companyName: formData.companyName,
  email: formData.email,
  contactName: formData.contactName,
});

const getAdditionalInfoStepSnapshot = (
  formData: SignUpFormData
): AdditionalInfoStepSnapshot => ({
  website: formData.website,
  industryType: formData.industryType,
  companyType: formData.companyType,
  registrationNumber: formData.registrationNumber,
  dunsNumber: formData.dunsNumber,
  address: formData.address,
});

const isUserInfoStepSnapshotMatching = (
  snapshot: UserInfoStepSnapshot | undefined,
  formData: SignUpFormData
): boolean =>
  !!snapshot &&
  snapshot.companyName === formData.companyName &&
  snapshot.email === formData.email &&
  snapshot.contactName === formData.contactName;

const isAdditionalInfoStepSnapshotMatching = (
  snapshot: AdditionalInfoStepSnapshot | undefined,
  formData: SignUpFormData
): boolean =>
  !!snapshot &&
  snapshot.website === formData.website &&
  snapshot.industryType === formData.industryType &&
  snapshot.companyType === formData.companyType &&
  snapshot.registrationNumber === formData.registrationNumber &&
  snapshot.dunsNumber === formData.dunsNumber &&
  snapshot.address === formData.address;

const SignUp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useAlertStore();

  const totalSteps = 5; // Last step in the main flow

  // Check if navigating from login with OTP verification state
  const locationState = location.state as {
    step: number;
    email: string;
  } | null;

  const [step, setStep] = useState<number>(SignUpStep.USER_INFO);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [validatedStepSnapshots, setValidatedStepSnapshots] =
    useState<ValidatedStepSnapshots>({});
  const progressWidth = `${((step - 1) / (totalSteps - 2)) * 100}%`;

  const handleNext = (validatedStep?: keyof ValidatedStepSnapshots) => {
    if (validatedStep === SignUpStep.USER_INFO) {
      setValidatedStepSnapshots((prev) => ({
        ...prev,
        [SignUpStep.USER_INFO]: getUserInfoStepSnapshot(formData),
      }));
    } else if (validatedStep === SignUpStep.ADDITIONAL_INFO) {
      setValidatedStepSnapshots((prev) => ({
        ...prev,
        [SignUpStep.ADDITIONAL_INFO]: getAdditionalInfoStepSnapshot(formData),
      }));
    }

    if (step < totalSteps) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > SignUpStep.USER_INFO) setStep(step - 1);
  };

  const createUser = async (): Promise<void> => {
    try {
      setIsCreatingUser(true);

      const payload: CreateUserPayload = {
        name: formData.contactName,
        email: formData.email,
        password: formData.password,
        companyDetails: {
          name: formData.companyName,
          website: formData.website,
          address: formData.address,
          industryType: formData.industryType,
          companyType: formData.companyType,
          registrationNumber: formData.registrationNumber,
          dunsNumber: formData.dunsNumber,
        },
      };

      const response = await axiosInstance.post<CreateUserResponse>(
        ENDPOINTS.USERS.CREATE,
        payload
      );
      const responseData = response.data;

      if (responseData.success) {
        handleUserCreated(responseData.data.isEmailVerified);
      } else {
        showAlert(ERROR_MESSAGES.FAILED_TO_CREATE_ACCOUNT, 'danger');
      }
    } catch (error) {
      Bugsnag.notify(error as Error, (event) => {
        event.addMetadata('context', {
          component: 'SignUp',
          method: 'createUser',
        });
      });
      showAlert(ERROR_MESSAGES.FAILED_TO_CREATE_ACCOUNT, 'danger');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleUserCreated = (isEmailVerified: boolean) => {
    if (isEmailVerified) {
      navigate(ROUTES.AUTH.LOGIN);
    } else {
      setStep(SignUpStep.OTP_VERIFICATION);
    }
  };

  const handlePasswordsValid = () => {
    createUser();
  };

  const [formData, setFormData] = useState<SignUpFormData>({
    contactName: '',
    email: '',
    companyName: '',
    website: '',
    address: '',
    industryType: '',
    companyType: '',
    registrationNumber: '',
    dunsNumber: '',
    password: '',
    confirmPassword: '',
  });

  // Handle navigation from login with OTP verification
  useEffect(() => {
    if (
      locationState?.step === SignUpStep.OTP_VERIFICATION &&
      locationState?.email
    ) {
      setStep(SignUpStep.OTP_VERIFICATION);
      setFormData((prev) => ({ ...prev, email: locationState.email }));
      // Clear location state after using it
      window.history.replaceState({}, document.title);
    }
  }, [locationState]);

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const goToRestrictedPage = () => {
    setStep(SignUpStep.RESTRICTED_USER);
  };

  const getTitle = () => {
    switch (step) {
      case SignUpStep.USER_INFO:
      case SignUpStep.ADDITIONAL_INFO:
        return 'Sign up';
      case SignUpStep.SET_PASSWORD:
        return 'Set Password';
      case SignUpStep.OTP_VERIFICATION:
        return 'Verify Email';
      default:
        return 'Sign up';
    }
  };

  const renderStep = () => {
    const isUserInfoStepPreviouslyValidated = isUserInfoStepSnapshotMatching(
      validatedStepSnapshots[SignUpStep.USER_INFO],
      formData
    );
    const isAdditionalInfoStepPreviouslyValidated =
      isAdditionalInfoStepSnapshotMatching(
        validatedStepSnapshots[SignUpStep.ADDITIONAL_INFO],
        formData
      );

    switch (step) {
      case SignUpStep.USER_INFO:
        return (
          <StepOne
            onNext={() => handleNext(SignUpStep.USER_INFO)}
            formData={formData}
            onChange={handleFormChange}
            onRestricted={goToRestrictedPage}
            isStepPreviouslyValidated={isUserInfoStepPreviouslyValidated}
          />
        );
      case SignUpStep.ADDITIONAL_INFO:
        return (
          <StepTwo
            onNext={() => handleNext(SignUpStep.ADDITIONAL_INFO)}
            onPrev={handlePrev}
            formData={formData}
            onChange={handleFormChange}
            isStepPreviouslyValidated={isAdditionalInfoStepPreviouslyValidated}
          />
        );
      case SignUpStep.SET_PASSWORD:
        return (
          <SetPasswordForm
            onPrev={handlePrev}
            onPasswordsValid={handlePasswordsValid}
            formData={formData}
            onChange={handleFormChange}
            isCreatingUser={isCreatingUser}
          />
        );
      case SignUpStep.OTP_VERIFICATION:
        return <OtpVerification formData={formData} />;
      case SignUpStep.RESTRICTED_USER:
        return <RestrictedUser goToStep={setStep} />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`${styles.card} ${step === SignUpStep.SET_PASSWORD || step === SignUpStep.OTP_VERIFICATION
        ? styles.cardLargeGap
        : ''
        }`}
    >
      {step !== SignUpStep.RESTRICTED_USER && (
        <>
          <h1>{getTitle()}</h1>

          {/* Progress Bar */}
          <div className={styles.progressContainer}>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressBar}
                style={{ width: progressWidth }}
              ></div>
            </div>
            <div className={styles.steps}>
              {[
                SignUpStep.USER_INFO,
                SignUpStep.ADDITIONAL_INFO,
                SignUpStep.SET_PASSWORD,
                SignUpStep.OTP_VERIFICATION,
              ].map((stepNumber) => (
                <span
                  key={stepNumber}
                  className={`${styles.step} ${step > stepNumber
                    ? styles.completedStep // previous
                    : step === stepNumber
                      ? styles.activeStep // current
                      : styles.inactiveStep // upcoming
                    }`}
                ></span>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Step Content */}
      <div className={styles.formArea}>{renderStep()}</div>
    </div>
  );
};

export default SignUp;
