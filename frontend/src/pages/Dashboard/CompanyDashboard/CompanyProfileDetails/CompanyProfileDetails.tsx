import { useEffect, useState, type Key } from 'react';
import styles from './CompanyProfileDetails.module.scss';

import companyProfile from '@assets/images/company-profile.png';

import { BiEditAlt } from 'react-icons/bi';

import infoicon from '@assets/images/info icon.svg';
import { getCompanyProfile } from '@service/company.service';
import SkeletonLoader from '@common/SkeletonLoader/SkeletonLoader';
import calender from '@assets/images/calendar.svg';
import { useAlertStore } from '@store/useAlertStore';
import { ERROR_MESSAGES } from '@constants/messages';
import { TOOLTIP_TEXT } from '@constants/tooltips';
import Tooltip from '@common/Tooltip/Tooltip';
import { formatDate } from '@utils/dateHelpers';

const CompanyProfileDetails = ({ onEdit }: { onEdit: () => void }) => {
  const [company, setCompany] = useState<any>(null);

  const { showAlert } = useAlertStore();
  useEffect(() => {
    (async () => {
      try {
        const data = await getCompanyProfile();

        const structuredData = [
          { label: 'Company Name', value: data.companyName },
          { label: 'Company Website', value: data.companyWebsite || '-' },
          { label: 'Industry', value: data.industry?.type },
          { label: 'Company Type', value: data.companyType?.type },
          { label: 'Registration Number', value: data.registrationNumber },
          { label: 'D-U-N-S Number', value: data.dunsNumber || '-' },
          { label: 'Name of Company Contact', value: data.companyContactName },
          {
            label: 'Email ID of Company Contact',
            value: data.companyContactEmail,
          },
          { label: 'Company Address', value: data.companyAddress },
        ];

        setCompany({
          ...data,
          infoList: structuredData,
        });
      } catch (err) {
        showAlert(ERROR_MESSAGES.PROFILE_FETCH_FAILED, 'danger');
      }
    })();
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.contentWrapper}>
        {!company ? (
          <SkeletonLoader type="companyProfile" />
        ) : (
          <>
            <div className={styles.headerRow}>
              <img
                src={companyProfile}
                alt="profile"
                className={styles.profileImg}
              />

              <div className={styles.companyInfo}>
                <div className={styles.companyNameWrap}>
                  <Tooltip
                    text={company.companyName}
                    className={styles.companyName}
                  />
                  <p>
                    <img src={calender} alt="calender" width="14" height="14" />
                    <span>
                      Date Joined:{' '}
                      {formatDate(company.createdAt)}
                    </span>
                  </p>
                </div>
                <button className={styles.editBtn} onClick={onEdit}>
                  <BiEditAlt style={{ width: '16px', height: '16px' }} /> Edit
                </button>
              </div>
            </div>

            <div className={styles.infoGrid}>
              {company.infoList.map(
                (item: any, index: Key | null | undefined) => (
                  <div key={index} className={styles.infoItem}>
                    <div className={styles.labelWithIcon}>
                      <h4>{item.label}</h4>

                      {item.label === 'D-U-N-S Number' && (
                        <Tooltip
                          text={TOOLTIP_TEXT.DUNS_NUMBER}
                          noTruncate
                        >
                          <img
                            src={infoicon}
                            alt="info"
                            className={styles.infoIcon}
                            width={12}
                            height={12}
                            style={{ verticalAlign: 'top' }}
                          />
                        </Tooltip>
                      )}
                    </div>

                    <Tooltip text={item.value} />
                  </div>
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CompanyProfileDetails;
