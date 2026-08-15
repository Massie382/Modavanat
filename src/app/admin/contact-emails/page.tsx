"use client";

import { PageHead, Card, Badge, Field, Switch, faNum } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";
import { defaultContactEmails } from "@/lib/admin-data";

export default function ContactEmailsPage() {
  const { toast } = useToast();
  return (
    <>
      <PageHead
        title="ایمیل‌های تماس"
        subtitle="مدیریت ایمیل‌های تماس نمایش‌داده‌شده در صفحه تماس با ما"
        actions={<button className="admin-btn admin-btn-primary" onClick={() => toast({ title: "ایجاد", description: "باز کردن فرم ایجاد..." })}>+ ایمیل جدید</button>}
      />

      <Card title="فهرست ایمیل‌ها">
        <table className="admin-table">
          <thead>
            <tr><th>نقش</th><th>آدرس ایمیل</th><th>توضیحات</th><th className="col-narrow">نمایش</th><th className="col-narrow">عمل</th></tr>
          </thead>
          <tbody>
            {defaultContactEmails.map((e) => (
              <tr key={e.id}>
                <td><strong>{e.role}</strong></td>
                <td><code className="admin-mono" dir="ltr">{e.address}</code></td>
                <td><span className="admin-muted">{e.description}</span></td>
                <td className="col-narrow"><Switch on={e.visible} onChange={() => {}} /></td>
                <td className="col-narrow">
                  <button className="admin-btn admin-btn-sm admin-btn-ghost" onClick={() => toast({ title: "ویرایش", description: "باز کردن فرم ویرایش..." })}>ویرایش</button>
                  <button className="admin-btn admin-btn-sm admin-btn-ghost" onClick={() => toast({ title: "حذف", description: "آیتم حذف شد.", variant: "destructive" })}>حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
