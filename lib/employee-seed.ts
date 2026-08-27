export type EmployeeSeed = {
  nik: string;
  nama: string;
  section: string;
  position: string;
  grup: string;
};

/**
 * Data awal karyawan, diimpor dari file database_template.xlsx (sheet "database")
 * yang diberikan saat setup. Setelah ini, kelola datanya lewat menu Kelola Karyawan
 * di panel admin — file ini hanya dipakai sekali sebagai bibit data awal.
 */
export const EMPLOYEE_SEED: EmployeeSeed[] = [
  { nik: 'SF22091307', nama: 'Basuki Rahmad', section: 'MANAGER AT', position: 'Manager', grup: 'Grup' },
  { nik: 'SF22031279', nama: 'Willi Afdin Oktaviansa', section: 'MECHANICAL & TOOLING ENGINEER', position: 'Asst. Manager', grup: 'Grup' },
  { nik: 'SF22031277', nama: "Al'ma Arif Arrahman", section: 'MECHANICAL & TOOLING ENGINEER', position: 'Staff', grup: 'Grup' },
  { nik: 'SF22081305', nama: 'Abdul Aris Prima Hidayatulloh', section: 'MECHANICAL & TOOLING ENGINEER', position: 'Staff', grup: 'Grup' },
  { nik: 'SF22111322', nama: 'Ali Reza Muthahhari', section: 'MECHANICAL & TOOLING ENGINEER', position: 'Staff', grup: 'Grup' },
  { nik: 'SF25091487', nama: 'Ardiyana Gunawan', section: 'MECHANICAL & TOOLING ENGINEER', position: 'Staff', grup: 'Grup' },
  { nik: 'SF26061541', nama: 'Muhammad Fauzi Triantoro', section: 'MECHANICAL & TOOLING ENGINEER', position: 'Staff', grup: 'Grup' },
  { nik: 'SF21091252', nama: 'Dickry Junior Triandy', section: 'ELECTRIC & AUTOMATION ENGINEER', position: 'Asst. Manager', grup: 'Grup' },
  { nik: 'SF21101256', nama: 'Marchdha Fredyka Jaya', section: 'ELECTRIC & AUTOMATION ENGINEER', position: 'Staff', grup: 'Grup' },
  { nik: 'SF22091308', nama: 'Zaqi Armanovandi', section: 'ELECTRIC & AUTOMATION ENGINEER', position: 'Staff', grup: 'Grup' },
  { nik: 'SF23031337', nama: 'Rizaldi Dwi Arisandi', section: 'ELECTRIC & AUTOMATION ENGINEER', position: 'Staff', grup: 'Grup' },
  { nik: 'SF25121513', nama: 'Domingo Uno Santoso', section: 'ELECTRIC & AUTOMATION ENGINEER', position: 'Staff', grup: 'Non-Grup' },
  { nik: 'SF26011522', nama: 'Rahmat Sholikhin Firdaus', section: 'ELECTRIC & AUTOMATION ENGINEER', position: 'Staff', grup: 'Grup' },
  { nik: 'SF26041533', nama: 'Adam Kusumah', section: 'ELECTRIC & AUTOMATION ENGINEER', position: 'Staff', grup: 'Non-Grup' },
  { nik: '1SF1108803', nama: 'Asrul Jamil', section: 'ELECTRIC & AUTOMATION ENGINEER', position: 'Staff', grup: 'Grup' },
  { nik: 'SF25011445', nama: 'Muhammad Ronal Rhomadhoni', section: 'ELECTRIC & AUTOMATION ENGINEER', position: 'Staff', grup: 'Grup' },
  { nik: 'OS3043', nama: 'Arini Latifah', section: 'APPLIED TECHNOLOGY ADMIN', position: 'Non-Staff', grup: 'Non-Grup' },
  { nik: 'I -10920', nama: 'Reyhan Maulana Putra Rama', section: 'APPLIED TECHNOLOGY OPERATOR', position: 'Non-Staff', grup: 'Non-Grup' },
  { nik: 'I -11504', nama: 'Adi Setiawan', section: 'APPLIED TECHNOLOGY OPERATOR', position: 'Non-Staff', grup: 'Non-Grup' },
  { nik: 'I -11536', nama: 'Muhammad Rizki Aditya Y', section: 'APPLIED TECHNOLOGY OPERATOR', position: 'Non-Staff', grup: 'Non-Grup' },
  { nik: 'I -11537', nama: 'Muhammad Farel Maulud', section: 'APPLIED TECHNOLOGY OPERATOR', position: 'Non-Staff', grup: 'Non-Grup' },
  { nik: 'I -11597', nama: "Achmad Rafif Sya'bani", section: 'APPLIED TECHNOLOGY OPERATOR', position: 'Non-Staff', grup: 'Non-Grup' },
  { nik: 'I -11595', nama: 'Ahmad Shandi Fanani Rosyadi', section: 'APPLIED TECHNOLOGY OPERATOR', position: 'Non-Staff', grup: 'Non-Grup' },
  { nik: 'MD0641', nama: 'Miftachul R', section: 'APPLIED TECHNOLOGY OPERATOR', position: 'Non-Staff', grup: 'Non-Grup' },
  { nik: 'MD0639', nama: 'M Fais D S', section: 'APPLIED TECHNOLOGY OPERATOR', position: 'Non-Staff', grup: 'Non-Grup' },
  { nik: 'T -070', nama: 'Sugeng Priyono', section: 'ELECTRICAL DEVELOPMENT', position: 'Non-Staff', grup: 'Non-Grup' },
  { nik: 'T -077', nama: 'Budi Setiawan', section: 'ELECTRICAL DEVELOPMENT', position: 'Non-Staff', grup: 'Non-Grup' },
  { nik: 'H -239', nama: 'Mahmud Hadi', section: 'ELECTRICAL DEVELOPMENT', position: 'Non-Staff', grup: 'Non-Grup' },
  { nik: 'I -11562', nama: 'Andika Ady Saputra', section: 'INDUCTION', position: 'Non-Staff', grup: 'Non-Grup' },
  { nik: 'I -11572', nama: 'M Zaini Robbani', section: 'INDUCTION', position: 'Non-Staff', grup: 'Non-Grup' },
];
