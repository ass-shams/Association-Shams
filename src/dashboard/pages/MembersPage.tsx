import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import DataStatePanel from '../components/DataStatePanel';
import SectionPage from '../components/SectionPage';
import { AdminApiError } from '../services/adminApi';
import { listMembers } from '../services/membersService';
import type { Member, MembersResult } from '../services/membersService';

const PAGE_SIZE = 10;
const FALLBACK_LOAD_ERROR = 'تعذّر تحميل المنخرطين. المرجو المحاولة مرة أخرى.';
const MUTED = '—';

const GENDER_LABELS: Record<Member['gender'], string> = {
  male: 'ذكر',
  female: 'أنثى',
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString('ar-MA', { dateStyle: 'medium', timeStyle: 'short' });
}

/** One labelled field inside the details panel (label above value). */
function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="dash-members__detail-field">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

/** Full details for one member, opened on demand from the table. */
function MemberDetails({ member, onClose }: { member: Member; onClose: () => void }) {
  return (
    <aside className="dash-members__detail" aria-label={`تفاصيل ${member.full_name}`}>
      <div className="dash-members__detail-head">
        <h3 className="dash-members__detail-title">{member.full_name}</h3>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onClose}>
          <span className="btn__label">إغلاق</span>
        </button>
      </div>

      <dl className="dash-members__detail-fields">
        <DetailField
          label="رقم الهاتف"
          value={
            <a dir="ltr" href={`tel:${member.phone}`}>
              {member.phone}
            </a>
          }
        />
        <DetailField label="المدينة" value={member.city} />
        <DetailField label="السن" value={member.age.toLocaleString('en-US')} />
        <DetailField label="الجنس" value={GENDER_LABELS[member.gender] ?? MUTED} />
        <DetailField label="تاريخ الإرسال" value={formatDate(member.created_at)} />
      </dl>

      <div className="dash-members__detail-block">
        <h4>الميولات</h4>
        {member.interests.length > 0 ? (
          <ul className="dash-members__chips">
            {member.interests.map((interest) => (
              <li key={interest} className="dash-members__chip">
                {interest}
              </li>
            ))}
          </ul>
        ) : (
          <p className="dash-members__muted">{MUTED}</p>
        )}
      </div>

      <div className="dash-members__detail-block">
        <h4>انتظاراتك من الانخراط</h4>
        {member.expectations ? (
          <p className="dash-members__full-text">{member.expectations}</p>
        ) : (
          <p className="dash-members__muted">لم يذكر أي انتظارات.</p>
        )}
      </div>
    </aside>
  );
}

/**
 * Members section.
 *
 * Renders registered members as a compact, spreadsheet-style table. Long
 * interests and expectations are clamped in the table; the full application is
 * available on demand through the details panel.
 */
export default function MembersPage() {
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<MembersResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Member | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listMembers({ search: searchTerm, page, pageSize: PAGE_SIZE });
      setResult(data);
    } catch (loadError) {
      setError(loadError instanceof AdminApiError ? loadError.message : FALLBACK_LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, page]);

  useEffect(() => {
    void load();
  }, [load]);

  // Debounce the search box.
  useEffect(() => {
    const handle = setTimeout(() => {
      setPage(1);
      setSearchTerm(searchInput.trim());
    }, 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  // Drop a selection that is no longer part of the visible result set.
  useEffect(() => {
    if (!result) {
      return;
    }
    setSelected((current) =>
      current && !result.data.some((item) => item.id === current.id) ? null : current,
    );
  }, [result]);

  const totalPages = Math.max(1, Math.ceil((result?.count ?? 0) / PAGE_SIZE));
  const members = result?.data ?? [];

  return (
    <SectionPage description="استعراض طلبات الانخراط المسجلة عبر استمارة الموقع.">
      <div className="dash-members">
        <div className="dash-members__toolbar">
          <div className="dash-members__search">
            <input
              className="input"
              type="search"
              value={searchInput}
              placeholder="ابحث بالاسم أو رقم الهاتف أو المدينة"
              aria-label="بحث في المنخرطين"
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
        </div>

        {selected ? <MemberDetails member={selected} onClose={() => setSelected(null)} /> : null}

        {loading ? (
          <DataStatePanel
            variant="loading"
            title="جارٍ تحميل المنخرطين…"
            description="المرجو الانتظار قليلاً."
          />
        ) : error ? (
          <DataStatePanel
            variant="error"
            title="تعذّر تحميل المنخرطين"
            description={error}
            action={
              <button
                type="button"
                className="btn btn--primary btn--md"
                onClick={() => void load()}
              >
                <span className="btn__label">إعادة المحاولة</span>
              </button>
            }
          />
        ) : members.length === 0 ? (
          <DataStatePanel
            variant="empty"
            title="لا يوجد منخرطون"
            description={
              searchTerm
                ? 'لا توجد نتائج مطابقة لبحثك.'
                : 'ستظهر هنا طلبات الانخراط المرسلة من استمارة الموقع.'
            }
          />
        ) : (
          <>
            <div className="dash-members__scroll">
              <table className="dash-members__table">
                <colgroup>
                  <col className="dash-members__col dash-members__col--name" />
                  <col className="dash-members__col dash-members__col--phone" />
                  <col className="dash-members__col dash-members__col--city" />
                  <col className="dash-members__col dash-members__col--age" />
                  <col className="dash-members__col dash-members__col--gender" />
                  <col className="dash-members__col dash-members__col--interests" />
                  <col className="dash-members__col dash-members__col--expectations" />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">الاسم الكامل</th>
                    <th scope="col">رقم الهاتف</th>
                    <th scope="col">المدينة</th>
                    <th scope="col">السن</th>
                    <th scope="col">الجنس</th>
                    <th scope="col">الميولات</th>
                    <th scope="col">انتظاراتك من الانخراط</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr
                      key={member.id}
                      className={selected?.id === member.id ? 'is-selected' : undefined}
                    >
                      <td className="dash-members__cell dash-members__cell--name">
                        <button
                          type="button"
                          className="dash-members__open"
                          aria-label={`عرض تفاصيل ${member.full_name}`}
                          onClick={() => setSelected(member)}
                        >
                          {member.full_name}
                        </button>
                      </td>
                      <td className="dash-members__cell">
                        <a dir="ltr" href={`tel:${member.phone}`}>
                          {member.phone}
                        </a>
                      </td>
                      <td className="dash-members__cell">{member.city}</td>
                      <td className="dash-members__cell">{member.age.toLocaleString('en-US')}</td>
                      <td className="dash-members__cell">
                        {GENDER_LABELS[member.gender] ?? MUTED}
                      </td>
                      <td className="dash-members__cell">
                        {member.interests.length > 0 ? member.interests.join('، ') : MUTED}
                      </td>
                      <td className="dash-members__cell dash-members__cell--expectations">
                        {member.expectations ? (
                          <span className="dash-members__clamp">{member.expectations}</span>
                        ) : (
                          <span className="dash-members__muted">{MUTED}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 ? (
              <div className="dash-members__pagination">
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <span className="btn__label">السابق</span>
                </button>
                <span className="dash-members__page-info">
                  الصفحة {page} من {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
                  <span className="btn__label">التالي</span>
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </SectionPage>
  );
}
