# 🚀 Portal Intern Activare Curieri (Glovo & Wolt)

Aplicație web securizată construită cu **Next.js**, **React** și **Tailwind CSS**, dedicată gestionării dosarelor de curieri pentru activare conturi, schimbări de autovehicule și schimbări de număr de telefon.

---

## 🔐 Cele 3 Conturi de Acces & Roluri

| Utilizator (Username) | Parolă | Rol / Identificator în Platformă | Ce Vede & Ce Poate Face |
| :--- | :--- | :--- | :--- |
| **`glovowolt`** | `recrutare123` | **Husein (GlovoWolt)** | Vede **strict** dosarele încărcate de el. Poate adăuga curieri noi și vede în timp real motivul respingerii dacă un dosar este respins. |
| **`ionutvarga`** | `recrutare123` | **Ionuț Varga** | Vede **strict** dosarele încărcate de el. Poate adăuga curieri noi și vede în timp real motivul respingerii dacă un dosar este respins. |
| **`admin`** *(sau `manager`)* | `recrutare123` | **Manager Coordonator** *(Acces General)* | Colectează datele de la amândoi. Are butoane dedicate per manager: **HUSEIN** și **IONUȚ VARGA**. Poate respinge cu motiv, aproba și modifica vehicul/telefon. |

---

## 🆕 Funcționalități Noi Adăugate:

1. **Motivul Respingerii (Respingere cu Justificare)**:
   - Când statusul este setat pe **🔴 Respins**, se deschide automat fereastra de motiv.
   - Poți selecta motive rapide cu un click (*Buletin expirat*, *Selfie neconform*, *Număr incorect*, etc.) sau poți scrie un motiv detaliat.
   - Motivul apare clar într-o casetă roșie pe cardul curierului, fiind vizibil instant și pentru Husein sau Ionuț Varga.

2. **Secțiune Schimbare Autovehicul (Mașină 🚗, Scuter 🛵, Bicicletă 🚲)**:
   - Buton direct **„Schimbă”** lângă tipul de vehicul pe fiecare dosar.
   - În fereastra de adăugare există opțiunea dedicată: **🚗 Schimbare Vehicul**.
   - Filtru în bara de sus pentru a vedea doar cererile de schimbare de vehicul.

3. **Secțiune Schimbare Număr Telefon**:
   - Buton direct **„Schimbă”** lângă numărul de telefon pe fiecare dosar.
   - La salvare, numărul nou se actualizează în tot sistemul și se reflectă instant în butonul de **WhatsApp** și apel direct.
   - În fereastra de adăugare există opțiunea dedicată: **📱 Schimbare Telefon**.
   - Filtru în bara de sus pentru a filtra după cereri de schimbare telefon.
