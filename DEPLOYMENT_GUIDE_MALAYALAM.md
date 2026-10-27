# Personal Cashbook — സമ്പൂർണ്ണ ഡിപ്ലോയ്മെന്റ് ഗൈഡ് (Deployment Guide)

ഈ ഗൈഡിൽ Personal Cashbook ആപ്ലിക്കേഷൻ **ഡോക്കർ (Docker)** ഉപയോഗിച്ച് ലോക്കലായും, **ക്ലൗഡിൽ (MongoDB Atlas + Render/Railway + Vercel)** സൗജന്യമായും എങ്ങനെ ലൈവായി ഹോസ്റ്റ് ചെയ്യാം എന്ന് ലളിതമായി വിശദീകരിക്കുന്നു.

---

## ഭാഗം 1: ഡോക്കർ (Docker) ഉപയോഗിച്ച് ഒറ്റ ക്ലിക്കിൽ റൺ ചെയ്യുക

നിങ്ങളുടെ കമ്പ്യൂട്ടറിലോ ലിനക്സ് സെർവറിലോ Docker & Docker Desktop ഇൻസ്റ്റാൾ ചെയ്തിട്ടുണ്ടെങ്കിൽ, താഴെ പറയുന്ന ഒറ്റ കമാൻഡ് വഴി **MongoDB, Express Backend, Next.js Frontend** എന്നിവ ഒരുമിച്ച് റൺ ചെയ്യാം:

```bash
docker compose up --build
```

- **ഫ്രണ്ട്‌എൻഡ്**: `http://localhost:3000`
- **ബാക്കെൻഡ് API**: `http://localhost:5000`
- **MongoDB**: `localhost:27017`

കണ്ടെയ്നറുകൾ ബാക്ക്ഗ്രൗണ്ടിൽ റൺ ചെയ്യാൻ:
```bash
docker compose up -d
```
നിർത്തലാക്കാൻ:
```bash
docker compose down
```

---

## ഭാഗം 2: ക്ലൗഡ് ഹോസ്റ്റിംഗ് (സൗജന്യ ക്ലൗഡ് സെറ്റപ്പ്)

ആപ്ലിക്കേഷൻ ഇന്റർനെറ്റിൽ എല്ലാവർക്കും ലഭ്യമാകുന്ന തരത്തിൽ ഹോസ്റ്റ് ചെയ്യുന്നതിനുള്ള 3 ഘട്ടങ്ങൾ:

### ഘട്ടം 1: MongoDB Atlas (ക്ലൗഡ് ഡാറ്റാബേസ് സെറ്റപ്പ്)

1. [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) സന്ദർശിച്ച് സൗജന്യ അക്കൗണ്ട് ഉണ്ടാക്കുക.
2. **Build a Database** ക്ലിക്ക് ചെയ്ത് **M0 Free Cluster** തിരഞ്ഞെടുക്കുക (ഇത് ആജീവനാന്തം സൗജന്യമാണ്).
3. **Database Access**-ൽ പോയി ഒരു യൂസർ ഉണ്ടാക്കുക (ഉദാഹരണത്തിന്: Username: `cashbook_admin`, ഒരു ശക്തമായ Password നൽകുക).
4. **Network Access**-ൽ പോയി **Add IP Address** ക്ലിക്ക് ചെയ്ത് `0.0.0.0/0` (Allow Access from Anywhere) നൽകുക. (ക്ലൗഡ് സെർവറുകളിൽ നിന്ന് ഡാറ്റാബേസ് കണക്ട് ചെയ്യാൻ ഇത് അത്യാവശ്യമാണ്).
5. **Database**-ലേക്ക് തിരികെ വന്ന് **Connect** -> **Drivers (Node.js)** ക്ലിക്ക് ചെയ്യുക.
6. ലഭിക്കുന്ന **Connection String (URI)** കോപ്പി ചെയ്യുക:
   ```
   mongodb+srv://cashbook_admin:<PASSWORD>@cluster0.xxxx.mongodb.net/personal_cashbook?retryWrites=true&w=majority
   ```
   *(ഇതിലെ `<PASSWORD>` മാറ്റി നിങ്ങളുടെ പാസ്‌വേഡ് നൽകുക).*

---

### ഘട്ടം 2: ബാക്കെൻഡ് ഹോസ്റ്റിംഗ് (Render അല്ലെങ്കിൽ Railway)

#### ഓപ്ഷൻ A: Render.com ഉപയോഗിച്ച് (ശുപാർശ ചെയ്യുന്നത്)
1. നിങ്ങളുടെ പ്രോജക്റ്റ് **GitHub**-ലേക്ക് പുഷ് ചെയ്യുക.
2. [render.com](https://render.com)-ൽ ലോഗിൻ ചെയ്ത് **New +** -> **Web Service** തിരഞ്ഞെടുക്കുക.
3. നിങ്ങളുടെ GitHub Repository കണക്ട് ചെയ്യുക.
4. താഴെ പറയുന്ന വിവരങ്ങൾ നൽകുക:
   - **Name**: `personal-cashbook-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Plan**: `Free`
5. **Environment Variables**-ൽ താഴെ പറയുന്നവ ചേർക്കുക:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGODB_URI`: ഘട്ടം 1-ൽ ലഭിച്ച MongoDB Atlas URI
   - `JWT_SECRET`: ശക്തമായ ഒരു രഹസ്യ വാക്ക് (ഉദാഹരണത്തിന്: 32+ അക്ഷരങ്ങളുള്ള റാൻഡം കീ)
   - `CLIENT_URL`: നിങ്ങളുടെ Vercel ഫ്രണ്ട്‌എൻഡ് ഡൊമെയ്ൻ (ഉദാ: `https://your-cashbook.vercel.app`)
6. **Create Web Service** ക്ലിക്ക് ചെയ്യുക. കുറച്ച് നിമിഷങ്ങൾക്കകം ബാക്കെൻഡ് ലൈവാകും.
   - ലഭിക്കുന്ന URL കോപ്പി ചെയ്തു വെക്കുക (ഉദാ: `https://personal-cashbook-api.onrender.com`).

---

### ഘട്ടം 3: ഫ്രണ്ട്‌എൻഡ് ഹോസ്റ്റിംഗ് (Vercel)

Next.js ആപ്ലിക്കേഷനുകൾ ഏറ്റവും വേഗതയോടെ റൺ ചെയ്യുന്നത് Vercel-ലാണ്:

1. [vercel.com](https://vercel.com)-ൽ ലോഗിൻ ചെയ്യുക.
2. **Add New...** -> **Project** ക്ലിക്ക് ചെയ്ത് നിങ്ങളുടെ GitHub Repository ഇമ്പോർട്ട് ചെയ്യുക.
3. **Configure Project** സെറ്റിംഗ്സിൽ:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Edit ക്ലിക്ക് ചെയ്ത് `frontend` എന്ന് സെലക്ട് ചെയ്യുക.
4. **Environment Variables**-ൽ താഴെ പറയുന്ന വേരിയബിൾ ചേർക്കുക:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: ഘട്ടം 2-ൽ Render-ൽ നിന്ന് ലഭിച്ച ബാക്കെൻഡ് URL + `/api` (ഉദാ: `https://personal-cashbook-api.onrender.com/api`)
5. **Deploy** ക്ലിക്ക് ചെയ്യുക.
6. 1-2 മിനിറ്റിനുള്ളിൽ നിങ്ങളുടെ Personal Cashbook ലോകത്തെവിടെ നിന്നും ആക്സസ് ചെയ്യാവുന്ന രീതിയിൽ ലൈവാകും!

---

## സംഗ്രഹം: എൻവയോൺമെന്റ് വേരിയബിളുകളുടെ ചെക്ക്‌ലിസ്റ്റ്

| ലൊക്കേഷൻ | വേരിയബിൾ പേര് | വിവരണം |
| :--- | :--- | :--- |
| **Backend** | `MONGODB_URI` | MongoDB Atlas കണക്ഷൻ സ്ട്രിംഗ് |
| **Backend** | `JWT_SECRET` | സെഷൻ ടോക്കൺ സുരക്ഷിതമാക്കാനുള്ള കീ |
| **Backend** | `CLIENT_URL` | ഫ്രണ്ട്‌എൻഡ് Vercel URL (CORS സുരക്ഷക്കായി) |
| **Backend** | `PORT` | `5000` |
| **Frontend** | `NEXT_PUBLIC_API_URL` | ബാക്കെൻഡ് Render URL + `/api` |
