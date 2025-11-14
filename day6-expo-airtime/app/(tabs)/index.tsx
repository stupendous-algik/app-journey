import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, Alert, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar, Keyboard } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = '@reminders_v1';

function formatDateLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-KE', { dateStyle: 'short', timeStyle: 'short' });
}

export default function HomeScreen() {
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [due, setDue] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flashId, setFlashId] = useState(null);

  const [isPickerVisible, setPickerVisible] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const [errors, setErrors] = useState({ phone: '', amount: '' });
  const [touched, setTouched] = useState({ phone: false, amount: false });
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setReminders(JSON.parse(raw));
      } catch (e) {
        console.warn('Failed to load reminders', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const normalizePhone = (input) => {
    const p = input.replace(/\s+/g, '').replace(/^\+/, '');
    if (/^(07|01)\d{8}$/.test(p)) return '254' + p.slice(1);
    if (/^254(7|1)\d{8}$/.test(p)) return p;
    return null;
  };

  const validate = () => {
    const errs = { phone: '', amount: '' };
    const n = normalizePhone(phone.trim());
    if (!n) errs.phone = 'Invalid phone — start with 07 or 01 (or use 2547...)';
    const amt = Number(amount);
    if (!amt || amt <= 0) errs.amount = 'Amount must be a positive number';
    setErrors(errs);
    setAttemptedSubmit(true);
    return !errs.phone && !errs.amount;
  };

  const saveReminders = async (list) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      const sorted = list.slice().sort((a,b) => {
        if (!a.due) return 1;
        if (!b.due) return -1;
        return new Date(a.due) - new Date(b.due);
      });
      setReminders(sorted);
    } catch (e) {
      Alert.alert('Save error', 'Could not save reminder.');
    }
  };

  const handleAdd = () => {
    if (!validate()) return;

    const n = normalizePhone(phone.trim());
    const amt = Number(amount);

    let dueIso = null;
    if (due) dueIso = new Date(due).toISOString();

    const newItem = { id: uuidv4(), phone: n, amount: amt, due: dueIso, createdAt: new Date().toISOString() };
    const list = [...reminders, newItem];
    saveReminders(list);
    setPhone('');
    setAmount('');
    setDue(null);

    Keyboard.dismiss();

    setFlashId(newItem.id);
    setTimeout(() => setFlashId(null), 800);
  };

  const handleDelete = (id) => {
    const list = reminders.filter(r => r.id !== id);
    saveReminders(list);
  };

  const isOverdue = (iso) => {
    if (!iso) return false;
    return new Date(iso) < new Date();
  };

  const openPicker = () => {
    setTempDate(due ? new Date(due) : new Date());
    setPickerVisible(true);
  };

  const handleConfirm = (selectedDate) => {
    setPickerVisible(false);
    setDue(selectedDate.toISOString());
  };

  const handleCancel = () => setPickerVisible(false);

  const renderItem = ({ item }) => {
    const isFlash = item.id === flashId;
    const overdue = isOverdue(item.due);
    return (
      <View style={[styles.card, isFlash ? styles.flash : null, overdue ? styles.overdueCard : null]}>
        <View style={{flex:1}}>
          <Text style={styles.phone}>{item.phone}</Text>
          <Text style={styles.amount}>Ksh {item.amount}</Text>
          {item.due ? <Text style={styles.due}>Due: {formatDateLocal(item.due)}</Text> : null}
        </View>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.ghostBtn}>
          <Text style={styles.ghostText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const inputBorderColor = (field) => {
    const hasError = errors[field];
    const wasTouched = touched[field];
    if (!hasError) return '#e6e6ea';
    return (wasTouched || attemptedSubmit) ? '#b00020' : '#e6e6ea';
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Airtime Reminder</Text>
      </View>

      <View style={styles.container}>
        <View style={styles.formCard}>
          <TextInput
            placeholder="Phone (e.g. 0712345678)"
            placeholderTextColor="#8a8a8f"
            value={phone}
            onChangeText={(t)=>{ setPhone(t); setErrors(prev=>({...prev, phone:''})); setTouched(prev=>({...prev, phone:true})); }}
            onBlur={()=> setTouched(prev=>({...prev, phone:true}))}
            keyboardType="phone-pad"
            style={[styles.input, { borderColor: inputBorderColor('phone') }]}
            selectionColor="#0b5cff"
          />
          {!!errors.phone && (touched.phone || attemptedSubmit) && <Text style={styles.err}>{errors.phone}</Text>}

          <TextInput
            placeholder="Amount (Ksh)"
            placeholderTextColor="#8a8a8f"
            value={amount}
            onChangeText={(t)=>{ setAmount(t); setErrors(prev=>({...prev, amount:''})); setTouched(prev=>({...prev, amount:true})); }}
            onBlur={()=> setTouched(prev=>({...prev, amount:true}))}
            keyboardType="numeric"
            style={[styles.input, { borderColor: inputBorderColor('amount') }]}
            selectionColor="#0b5cff"
          />
          {!!errors.amount && (touched.amount || attemptedSubmit) && <Text style={styles.err}>{errors.amount}</Text>}

          <View style={styles.row}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={openPicker} activeOpacity={0.8}>
              <Text style={styles.secondaryText}>{due ? `Due: ${formatDateLocal(due)}` : 'Pick due date/time'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.clearBtn} onPress={() => setDue(null)} activeOpacity={0.8}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleAdd} activeOpacity={0.9}>
            <Text style={styles.primaryText}>Save Reminder</Text>
          </TouchableOpacity>
        </View>

        <DateTimePickerModal
          isVisible={isPickerVisible}
          mode="datetime"
          date={tempDate}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          minimumDate={new Date()}
        />

        <View style={styles.listWrap}>
          {loading ? <Text>Loading…</Text> : (reminders.length === 0 ? <Text style={styles.empty}>No reminders yet.</Text> :
            <FlatList
              data={reminders}
              keyExtractor={item => item.id}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: 160 }}
              keyboardShouldPersistTaps='handled'
              showsVerticalScrollIndicator={true}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f8fb', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0 },
  header: { paddingVertical:18, backgroundColor:'#fff', borderBottomWidth:1, borderBottomColor:'#eee', alignItems:'center' },
  headerTitle: { fontSize:20, fontWeight:'800', color:'#0b1226' },

  container: { flex:1, padding:16 },
  formCard: { backgroundColor:'#fff', padding:14, borderRadius:12, marginBottom:12, shadowColor:'#000', shadowOpacity:0.06, shadowRadius:12, elevation:3 },

  input: { borderWidth:1, borderColor:'#e6e6ea', padding:12, borderRadius:10, marginBottom:8, color:'#0b1226', backgroundColor:'#fff' },
  err: { color: '#b00020', marginBottom:8, fontSize:12 },

  row: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:12 },
  secondaryBtn: { flex:1, paddingVertical:12, paddingHorizontal:14, borderRadius:10, borderWidth:1, borderColor:'#0b5cff', backgroundColor:'#fff', marginRight:10, alignItems:'center', justifyContent:'center' },
  secondaryText: { color:'#0b5cff', fontWeight:'700' },
  clearBtn: { paddingVertical:10, paddingHorizontal:12 },
  clearText: { color:'#b00020', fontWeight:'700' },

  primaryBtn: { backgroundColor:'#0b5cff', paddingVertical:14, borderRadius:12, alignItems:'center', justifyContent:'center', shadowColor:'#0b5cff', shadowOpacity:0.18, shadowRadius:10, elevation:4 },
  primaryText: { color:'#fff', fontWeight:'800', fontSize:16 },

  listWrap: { marginTop:8, paddingBottom:40 },

  card: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, borderRadius:12, backgroundColor:'#fff', marginBottom:12, borderWidth:1, borderColor:'#f0f2f6', shadowColor:'#000', shadowOpacity:0.03, shadowRadius:8, elevation:2 },
  flash: { backgroundColor: '#fff7f7' },
  overdueCard: { borderColor: '#d32f2f', backgroundColor: '#fff3f3' },

  phone: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontWeight:'800', color:'#0b1226', marginBottom:6 },
  amount: { color:'#d32f2f', marginBottom:6, fontWeight:'700' },
  due: { color:'#666', fontSize:12 },

  ghostBtn: { padding:6 },
  ghostText: { color:'#b00020', fontWeight:'700' },

  empty: { textAlign:'center', color:'#666' }
});
